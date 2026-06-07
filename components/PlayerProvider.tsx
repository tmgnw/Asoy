"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayableTrack = {
  id: string;
  name: string;
  artistNames: string;
  albumImage: string | null;
  previewUrl: string | null;
  durationMs: number;
};

export type PlaybackSource =
  | "preview"
  | "full"
  | "youtube"
  | "loading"
  | "none";

export type RepeatMode = "off" | "all" | "one";

type PlayerState = {
  current: PlayableTrack | null;
  isPlaying: boolean;
  progress: number; // 0..1
  volume: number; // 0..1
  source: PlaybackSource;
  totalMs: number;
  notice: string | null;
  /** When set, the hidden YouTube iframe is rendered with this videoId. */
  youtubeVideoId: string | null;
  /** Queue of tracks for prev/next navigation. */
  queue: PlayableTrack[];
  queueIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
};

type PlayerContextValue = PlayerState & {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Play 30-sec preview only. */
  play: (t: PlayableTrack) => void;
  /** Try Audius → YouTube → preview, in order. */
  playFull: (t: PlayableTrack) => Promise<void>;
  /** Set a queue + start index, play track at index. */
  playFromQueue: (queue: PlayableTrack[], index: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seek: (frac: number) => void;
  setVolume: (v: number) => void;
  /** Internal — used by the hidden YouTube host iframe to register its API handle. */
  _registerYoutubePlayer: (player: YouTubePlayerHandle | null) => void;
  /** Internal — patches state from YouTube iframe events. */
  _patchFromYoutube: (patch: Partial<PlayerState>) => void;
};

/** Minimal shape we use from the YT IFrame Player. */
export type YouTubePlayerHandle = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (v0to100: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<YouTubePlayerHandle | null>(null);
  const [state, setState] = useState<PlayerState>({
    current: null,
    isPlaying: false,
    progress: 0,
    volume: 0.7,
    source: "none",
    totalMs: 0,
    notice: null,
    youtubeVideoId: null,
    queue: [],
    queueIndex: -1,
    shuffle: false,
    repeat: "off",
  });

  // Keep latest queue/index/shuffle/repeat in refs so the auto-advance handlers
  // (on track end) read fresh values without re-binding listeners.
  const queueRef = useRef<{ q: PlayableTrack[]; idx: number; shuffle: boolean; repeat: RepeatMode }>({
    q: [],
    idx: -1,
    shuffle: false,
    repeat: "off",
  });
  useEffect(() => {
    queueRef.current = {
      q: state.queue,
      idx: state.queueIndex,
      shuffle: state.shuffle,
      repeat: state.repeat,
    };
  }, [state.queue, state.queueIndex, state.shuffle, state.repeat]);

  // Ref that the auto-advance logic will fill once `next` is defined below.
  const autoAdvanceRef = useRef<(() => void) | null>(null);

  // Track current source in a ref so callbacks (used by external YT handlers
  // before React re-renders) can read it without going stale.
  const sourceRef = useRef<PlaybackSource>("none");
  useEffect(() => {
    sourceRef.current = state.source;
  }, [state.source]);

  // HTML5 audio element (preview + Audius)
  useEffect(() => {
    if (audioRef.current) return;
    const el = new Audio();
    el.volume = state.volume;
    audioRef.current = el;
    const onTime = () => {
      if (sourceRef.current === "youtube") return; // YT host owns progress
      if (!el.duration) return;
      setState((s) => ({ ...s, progress: el.currentTime / el.duration }));
    };
    const onLoaded = () => {
      if (sourceRef.current === "youtube") return;
      if (el.duration && Number.isFinite(el.duration)) {
        setState((s) => ({ ...s, totalMs: el.duration * 1000 }));
      }
    };
    const onEnd = () => {
      if (sourceRef.current === "youtube") return;
      setState((s) => ({ ...s, isPlaying: false, progress: 0 }));
      // Auto-advance using the latest queue/repeat from refs
      autoAdvanceRef.current?.();
    };
    const onPlay = () => {
      if (sourceRef.current === "youtube") return;
      setState((s) => ({ ...s, isPlaying: true }));
    };
    const onPause = () => {
      if (sourceRef.current === "youtube") return;
      setState((s) => ({ ...s, isPlaying: false }));
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("ended", onEnd);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _registerYoutubePlayer = useCallback(
    (player: YouTubePlayerHandle | null) => {
      ytRef.current = player;
    },
    [],
  );

  const _patchFromYoutube = useCallback((patch: Partial<PlayerState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const play = useCallback((t: PlayableTrack) => {
    const el = audioRef.current;
    if (!el) return;
    // If switching away from YouTube, stop the YT iframe playback first.
    if (ytRef.current && sourceRef.current === "youtube") {
      try {
        ytRef.current.stopVideo();
      } catch {
        /* noop */
      }
    }
    if (!t.previewUrl) {
      setState((s) => ({
        ...s,
        current: t,
        isPlaying: false,
        progress: 0,
        source: "none",
        totalMs: 0,
        notice: "Preview tidak tersedia untuk track ini.",
        youtubeVideoId: null,
      }));
      el.pause();
      return;
    }
    setState((s) => ({
      ...s,
      current: t,
      progress: 0,
      source: "preview",
      totalMs: 30_000,
      notice: null,
      youtubeVideoId: null,
    }));
    el.src = t.previewUrl;
    el.currentTime = 0;
    el.play().catch(() => {
      setState((s) => ({ ...s, isPlaying: false }));
    });
  }, []);

  const playFull = useCallback(async (t: PlayableTrack) => {
    const el = audioRef.current;
    if (!el) return;
    // Stop currently playing audio sources so nothing overlaps.
    el.pause();
    if (ytRef.current && sourceRef.current === "youtube") {
      try {
        ytRef.current.stopVideo();
      } catch {
        /* noop */
      }
    }
    setState((s) => ({
      ...s,
      current: t,
      progress: 0,
      source: "loading",
      totalMs: 0,
      notice: null,
      youtubeVideoId: null,
    }));
    try {
      const params = new URLSearchParams({
        title: t.name,
        artist: t.artistNames,
      });
      const res = await fetch(`/api/full-track?${params}`, { cache: "no-store" });
      const data = (await res.json()) as {
        streamUrl: string | null;
        durationMs?: number;
        source?: string;
        isCommunityUpload?: boolean;
        youtubeVideoId?: string;
      };
      if (data.source === "audius" && data.streamUrl) {
        setState((s) => ({
          ...s,
          source: "full",
          totalMs: data.durationMs ?? 0,
          notice: data.isCommunityUpload
            ? "Full version is a community upload on Audius — quality may vary."
            : null,
          youtubeVideoId: null,
        }));
        el.src = data.streamUrl;
        el.currentTime = 0;
        await el.play().catch(() => {
          setState((s) => ({ ...s, isPlaying: false }));
        });
        return;
      }
      if (data.source === "youtube" && data.youtubeVideoId) {
        // HiddenYouTubeHost will pick up the new videoId via context and
        // call its iframe API. We don't directly create the iframe here.
        el.removeAttribute("src");
        el.load();
        setState((s) => ({
          ...s,
          source: "youtube",
          totalMs: 0,
          notice: null,
          youtubeVideoId: data.youtubeVideoId ?? null,
        }));
        return;
      }
    } catch {
      // network/etc — fall through to preview
    }
    // Fallback: preview, with a clear notice.
    if (t.previewUrl) {
      setState((s) => ({
        ...s,
        source: "preview",
        totalMs: 30_000,
        notice:
          "Lagu full tidak ditemukan di Audius/YouTube — playing 30-sec preview.",
        youtubeVideoId: null,
      }));
      el.src = t.previewUrl;
      el.currentTime = 0;
      el.play().catch(() => {
        setState((s) => ({ ...s, isPlaying: false }));
      });
    } else {
      setState((s) => ({
        ...s,
        source: "none",
        totalMs: 0,
        isPlaying: false,
        notice: "Lagu ini tidak punya full version maupun preview.",
        youtubeVideoId: null,
      }));
      el.pause();
    }
  }, []);

  const playFromQueue = useCallback(
    (queue: PlayableTrack[], index: number) => {
      if (queue.length === 0) return;
      const safeIdx = Math.max(0, Math.min(index, queue.length - 1));
      setState((s) => ({ ...s, queue, queueIndex: safeIdx }));
      void playFull(queue[safeIdx]);
    },
    [playFull],
  );

  const next = useCallback(() => {
    const { q, idx, shuffle, repeat } = queueRef.current;
    if (q.length === 0) return;
    let newIdx: number;
    if (repeat === "one") {
      newIdx = idx;
    } else if (shuffle) {
      if (q.length === 1) newIdx = 0;
      else {
        const choices = Array.from({ length: q.length }, (_, i) => i).filter(
          (i) => i !== idx,
        );
        newIdx = choices[Math.floor(Math.random() * choices.length)];
      }
    } else {
      newIdx = idx + 1;
      if (newIdx >= q.length) {
        if (repeat === "all") newIdx = 0;
        else return; // No next, stop
      }
    }
    setState((s) => ({ ...s, queueIndex: newIdx }));
    void playFull(q[newIdx]);
  }, [playFull]);

  const prev = useCallback(() => {
    const { q, idx, shuffle } = queueRef.current;
    if (q.length === 0) return;
    let newIdx: number;
    if (shuffle && q.length > 1) {
      const choices = Array.from({ length: q.length }, (_, i) => i).filter(
        (i) => i !== idx,
      );
      newIdx = choices[Math.floor(Math.random() * choices.length)];
    } else {
      newIdx = idx - 1;
      if (newIdx < 0) newIdx = q.length - 1; // wrap to end
    }
    setState((s) => ({ ...s, queueIndex: newIdx }));
    void playFull(q[newIdx]);
  }, [playFull]);

  // Wire up auto-advance for when an audio/YouTube track ends.
  useEffect(() => {
    autoAdvanceRef.current = () => {
      const { repeat } = queueRef.current;
      if (repeat === "one") {
        // Replay same track
        const { q, idx } = queueRef.current;
        if (q[idx]) void playFull(q[idx]);
        return;
      }
      next();
    };
  }, [next, playFull]);

  const toggleShuffle = useCallback(() => {
    setState((s) => ({ ...s, shuffle: !s.shuffle }));
  }, []);

  const cycleRepeat = useCallback(() => {
    setState((s) => ({
      ...s,
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    }));
  }, []);

  const toggle = useCallback(() => {
    if (sourceRef.current === "youtube" && ytRef.current) {
      // YT handle: ask it to play or pause; state will update via events
      try {
        if (state.isPlaying) ytRef.current.pauseVideo();
        else ytRef.current.playVideo();
      } catch {
        /* noop */
      }
      return;
    }
    const el = audioRef.current;
    if (!el || !el.src) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, [state.isPlaying]);

  const seek = useCallback((frac: number) => {
    const clamped = Math.max(0, Math.min(1, frac));
    if (sourceRef.current === "youtube" && ytRef.current) {
      try {
        const dur = ytRef.current.getDuration();
        if (dur > 0) ytRef.current.seekTo(clamped * dur, true);
      } catch {
        /* noop */
      }
      return;
    }
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = clamped * el.duration;
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) audioRef.current.volume = clamped;
    if (ytRef.current) {
      try {
        ytRef.current.setVolume(clamped * 100);
      } catch {
        /* noop */
      }
    }
    setState((s) => ({ ...s, volume: clamped }));
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      audioRef,
      play,
      playFull,
      playFromQueue,
      toggle,
      next,
      prev,
      toggleShuffle,
      cycleRepeat,
      seek,
      setVolume,
      _registerYoutubePlayer,
      _patchFromYoutube,
    }),
    [
      state,
      play,
      playFull,
      playFromQueue,
      toggle,
      next,
      prev,
      toggleShuffle,
      cycleRepeat,
      seek,
      setVolume,
      _registerYoutubePlayer,
      _patchFromYoutube,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}
