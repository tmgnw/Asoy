"use client";

import { useEffect, useRef } from "react";
import { usePlayer, type YouTubePlayerHandle } from "./PlayerProvider";

// Sentinel for telling the player it ended so it can auto-advance the queue.
// We exploit a fresh closure via the `next` handler exposed from context.

// Minimal typing for the slice of YT IFrame API we use.
type YT = {
  Player: new (
    elementOrId: HTMLElement | string,
    options: {
      videoId?: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: (e: { target: YouTubePlayerHandle }) => void;
        onStateChange?: (e: { target: YouTubePlayerHandle; data: number }) => void;
      };
    },
  ) => YouTubePlayerHandle & { destroy(): void };
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
};

declare global {
  interface Window {
    YT?: YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YT> | null = null;
function loadYouTubeApi(): Promise<YT> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YT>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector('script[data-yt-iframe-api]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.dataset.ytIframeApi = "1";
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

export default function HiddenYouTubeHost() {
  const {
    youtubeVideoId,
    volume,
    next,
    _registerYoutubePlayer,
    _patchFromYoutube,
  } = usePlayer();

  // Keep latest `next` in a ref so the onStateChange handler doesn't capture a
  // stale copy when the queue/index changes.
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<(YouTubePlayerHandle & { destroy(): void }) | null>(null);
  const pollRef = useRef<number | null>(null);

  // Create/destroy the YT.Player when videoId becomes (un)set.
  useEffect(() => {
    if (!youtubeVideoId) {
      // Tear down
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          /* noop */
        }
        playerRef.current = null;
        _registerYoutubePlayer(null);
      }
      return;
    }

    let cancelled = false;
    (async () => {
      const YTApi = await loadYouTubeApi();
      if (cancelled) return;

      // If a player already exists, just load the new video.
      if (playerRef.current) {
        try {
          playerRef.current.loadVideoById(youtubeVideoId);
        } catch {
          /* noop */
        }
        return;
      }

      if (!hostRef.current) return;
      const player = new YTApi.Player(hostRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            try {
              e.target.setVolume(Math.round(volume * 100));
            } catch {
              /* noop */
            }
            playerRef.current = e.target as YouTubePlayerHandle & {
              destroy(): void;
            };
            _registerYoutubePlayer(e.target);
            // Push initial duration if available
            try {
              const dur = e.target.getDuration();
              if (dur > 0) _patchFromYoutube({ totalMs: dur * 1000 });
            } catch {
              /* noop */
            }
          },
          onStateChange: (e) => {
            const STATE = YTApi.PlayerState;
            if (e.data === STATE.PLAYING) {
              try {
                const dur = e.target.getDuration();
                _patchFromYoutube({
                  isPlaying: true,
                  totalMs: dur > 0 ? dur * 1000 : 0,
                });
              } catch {
                _patchFromYoutube({ isPlaying: true });
              }
              if (!pollRef.current) {
                pollRef.current = window.setInterval(() => {
                  const p = playerRef.current;
                  if (!p) return;
                  try {
                    const cur = p.getCurrentTime();
                    const dur = p.getDuration();
                    if (dur > 0) {
                      _patchFromYoutube({
                        progress: cur / dur,
                        totalMs: dur * 1000,
                      });
                    }
                  } catch {
                    /* noop */
                  }
                }, 250);
              }
            } else if (
              e.data === STATE.PAUSED ||
              e.data === STATE.ENDED ||
              e.data === STATE.UNSTARTED
            ) {
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
              _patchFromYoutube({
                isPlaying: false,
                ...(e.data === STATE.ENDED ? { progress: 0 } : {}),
              });
              if (e.data === STATE.ENDED) {
                // Auto-advance to next track in queue (or loop/repeat)
                nextRef.current?.();
              }
            }
          },
        },
      });
      // The onReady event will fill playerRef. As a safety, also stash it now.
      playerRef.current = player;
    })();

    return () => {
      cancelled = true;
    };
  }, [youtubeVideoId, _registerYoutubePlayer, _patchFromYoutube, volume]);

  // The host div MUST be in the DOM with a measurable size for the YouTube
  // iframe to actually play audio in most browsers — we hide it visually with
  // a 1x1 px footprint in the corner and opacity 0, rather than display:none.
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div ref={hostRef} />
    </div>
  );
}
