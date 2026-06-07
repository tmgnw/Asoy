"use client";

import Image from "next/image";
import { usePlayer } from "./PlayerProvider";

function Btn({
  children,
  onClick,
  ariaLabel,
  primary,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  primary?: boolean;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      disabled={disabled}
      className={
        primary
          ? "grid place-items-center size-8 rounded-full bg-white text-black hover:scale-105 transition disabled:opacity-40 disabled:hover:scale-100"
          : `grid place-items-center size-8 rounded-full transition disabled:opacity-30 disabled:hover:text-white/80 ${
              active
                ? "text-[var(--accent)] hover:text-[var(--accent)]"
                : "text-white/80 hover:text-white"
            }`
      }
    >
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7-11-7Z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
    </svg>
  );
}

function fmt(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function Player() {
  const {
    current,
    isPlaying,
    progress,
    volume,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    source,
    totalMs,
    queue,
    queueIndex,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const elapsedMs = totalMs * progress;
  const canPlay = source === "full" || source === "preview" || source === "youtube";
  const hasQueue = queue.length > 1 && queueIndex >= 0;

  return (
    <footer className="h-[92px] shrink-0 px-4 py-2 bg-black text-white border-t border-white/5">
      <div className="grid grid-cols-3 items-center h-full gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0">
          {current?.albumImage ? (
            <Image
              src={current.albumImage}
              alt=""
              width={56}
              height={56}
              className="size-14 rounded shrink-0 object-cover"
            />
          ) : (
            <div className="size-14 rounded shrink-0 bg-[var(--surface-3)]" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {current?.name ?? "—"}
            </div>
            <div className="truncate text-xs text-white/60">
              {current?.artistNames ?? "Pick a track to start"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <Btn
              ariaLabel="Shuffle"
              onClick={toggleShuffle}
              active={shuffle}
              title={shuffle ? "Shuffle: on" : "Shuffle: off"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3h4v4h-2V6.41l-3.3 3.3-1.4-1.42L17.58 5H17V3Zm4 14v4h-4v-2h.58l-3.3-3.3 1.42-1.4L19 17.58V17h2ZM3 5h4l9 14h5v2h-6L6 7H3V5Zm0 14h4l2-3.1-1.2-1.86L6.4 17H3v2Z" />
              </svg>
            </Btn>
            <Btn
              ariaLabel="Previous"
              onClick={prev}
              disabled={!hasQueue}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6V6Zm12 0v12L8 12l10-6Z" />
              </svg>
            </Btn>
            <Btn
              ariaLabel={isPlaying ? "Pause" : "Play"}
              onClick={toggle}
              primary
              disabled={!canPlay}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </Btn>
            <Btn
              ariaLabel="Next"
              onClick={next}
              disabled={!hasQueue}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6h2v12h-2V6ZM6 6l10 6L6 18V6Z" />
              </svg>
            </Btn>
            <Btn
              ariaLabel="Repeat"
              onClick={cycleRepeat}
              active={repeat !== "off"}
              title={
                repeat === "off"
                  ? "Repeat: off"
                  : repeat === "all"
                    ? "Repeat: all"
                    : "Repeat: one"
              }
            >
              {repeat === "one" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 7h10v2l3-3-3-3v2H5v6h2V7Zm10 10H7v-2l-3 3 3 3v-2h12v-6h-2v4Z" />
                  <text x="11" y="15.5" fontSize="7" fontWeight="900" fill="currentColor">1</text>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 7h10v2l3-3-3-3v2H5v6h2V7Zm10 10H7v-2l-3 3 3 3v-2h12v-6h-2v4Z" />
                </svg>
              )}
            </Btn>
          </div>
          <div className="flex items-center gap-2 w-full max-w-[600px]">
            <span className="text-[10px] text-white/60 tabular-nums w-10 text-right">
              {fmt(elapsedMs)}
            </span>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(e) => seek(Number(e.target.value) / 1000)}
              disabled={!canPlay}
              className="flex-1 accent-white h-1"
              aria-label="Seek"
            />
            <span className="text-[10px] text-white/60 tabular-nums w-10">
              {fmt(totalMs)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white/70">
            <path d="M3 9v6h4l5 5V4L7 9H3Z" />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-28 accent-white h-1"
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
  );
}
