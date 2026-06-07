"use client";

import Image from "next/image";
import Link from "next/link";
import type { Track } from "@/lib/types";
import { formatDuration, pickImage } from "@/lib/types";
import { usePlayer, type PlayableTrack } from "./PlayerProvider";

function trackToPlayable(t: Track): PlayableTrack {
  return {
    id: t.id,
    name: t.name,
    artistNames: t.artists.map((a) => a.name).join(", "),
    albumImage: pickImage(t.album?.images, 64) ?? null,
    previewUrl: t.preview_url,
    durationMs: t.duration_ms,
  };
}

export default function TrackRow({
  track,
  index,
  queue,
  showAlbum = true,
}: {
  track: Track;
  index: number;
  /** Sibling tracks for prev/next navigation. Defaults to [track]. */
  queue?: Track[];
  showAlbum?: boolean;
}) {
  const { current, isPlaying, play, playFromQueue, toggle } = usePlayer();
  const albumImg = pickImage(track.album?.images, 64);
  const isActive = current?.id === track.id;
  const playing = isActive && isPlaying;

  // Click row/title → play full (Audius → YouTube → preview)
  // and prime the queue so prev/next work.
  const onActivateFull = () => {
    if (isActive) {
      toggle();
      return;
    }
    const list = queue && queue.length > 0 ? queue : [track];
    const startIdx = queue ? queue.findIndex((t) => t.id === track.id) : 0;
    playFromQueue(list.map(trackToPlayable), startIdx >= 0 ? startIdx : index);
  };

  // Click the small play icon → ALWAYS 30-sec preview only
  const onActivatePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive && playing) {
      toggle();
      return;
    }
    play(trackToPlayable(track));
  };

  const stopBubble = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivateFull}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivateFull();
        }
      }}
      className={
        "group grid grid-cols-[24px_1fr_auto] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_56px] items-center gap-4 rounded px-3 py-2 cursor-pointer select-none hover:bg-white/10 focus:bg-white/10 focus:outline-none " +
        (isActive ? "text-[var(--accent)]" : "text-white/90")
      }
    >
      <div className="text-right text-sm text-white/60">
        <button
          type="button"
          onClick={onActivatePreview}
          aria-label={
            playing ? "Pause preview" : `Play 30-sec preview of ${track.name}`
          }
          title="Play 30-sec preview"
          className="hidden group-hover:inline-flex group-focus-within:inline-flex items-center justify-center"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M8 5v14l11-7-11-7Z" />
            </svg>
          )}
        </button>
        <span className="group-hover:hidden group-focus-within:hidden tabular-nums">
          {index + 1}
        </span>
      </div>
      <div className="flex items-center gap-3 min-w-0">
        {showAlbum && albumImg && (
          <Image
            src={albumImg}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {track.name}
          </div>
          <div className="truncate text-xs text-white/60">
            {track.artists.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ", "}
                <Link
                  href={`/artist/${a.id}`}
                  onClick={stopBubble}
                  className="hover:underline hover:text-white"
                >
                  {a.name}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
      {showAlbum && track.album && (
        <div className="hidden md:block truncate text-sm text-white/60">
          <Link
            href={`/album/${track.album.id}`}
            onClick={stopBubble}
            className="hover:underline hover:text-white"
          >
            {track.album.name}
          </Link>
        </div>
      )}
      <div className="text-right text-sm text-white/60 tabular-nums">
        {formatDuration(track.duration_ms)}
      </div>
    </div>
  );
}
