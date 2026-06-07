import Image from "next/image";
import Link from "next/link";
import { getTopPlaylists } from "@/lib/music";
import { pickImage } from "@/lib/types";

function AsoyMark() {
  // Black rounded-square tile with a white circle and play triangle inside —
  // matches the favicon style.
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      aria-hidden
      className="shrink-0"
    >
      <rect x="0" y="0" width="32" height="32" rx="8" fill="#000000" />
      <circle cx="16" cy="16" r="9" fill="white" />
      <path d="M16 11 L21 20 L11 20 Z" fill="#000000" />
    </svg>
  );
}

function HomeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.172 3 11v10h6v-6h6v6h6V11l-9-7.828Z" />
    </svg>
  );
}

function SearchIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10.5 3a7.5 7.5 0 1 1-4.546 13.473l-4.06 4.06-1.414-1.414 4.06-4.06A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
    </svg>
  );
}

function LibraryIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 22V2h2v20H3Zm4 0V2h2v20H7Zm6.5-1.5L11 5l5-1 3 16-5.5 1.5Z" />
    </svg>
  );
}

export default async function Sidebar() {
  let playlists: Awaited<ReturnType<typeof getTopPlaylists>> = [];
  try {
    playlists = await getTopPlaylists(12);
  } catch {
    // sidebar still renders nav even if playlist fetch fails
  }

  return (
    <aside className="hidden md:flex w-[300px] shrink-0 flex-col gap-2">
      <nav className="rounded-lg bg-[var(--surface)] p-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-white/90 hover:text-white"
        >
          <AsoyMark />
          <span className="text-lg font-bold tracking-tight">Asoy</span>
        </Link>
        <ul className="mt-2 space-y-1 text-sm font-semibold text-white/80">
          <li>
            <Link
              href="/"
              className="flex items-center gap-4 rounded-md px-3 py-2 hover:bg-white/10 hover:text-white"
            >
              <HomeIcon />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link
              href="/search"
              className="flex items-center gap-4 rounded-md px-3 py-2 hover:bg-white/10 hover:text-white"
            >
              <SearchIcon />
              <span>Search</span>
            </Link>
          </li>
        </ul>
      </nav>

      <section className="flex flex-1 flex-col rounded-lg bg-[var(--surface)] p-3 overflow-hidden">
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-3 text-white/80 font-semibold text-sm">
            <LibraryIcon />
            <span>Your Library</span>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Add"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6Z" />
            </svg>
          </button>
        </div>
        {playlists.length > 0 ? (
          <ul className="mt-1 space-y-1 overflow-y-auto pr-1 text-sm">
            {playlists.map((p) => {
              const img = pickImage(p.images, 56);
              return (
                <li key={p.id}>
                  <Link
                    href={`/playlist/${p.id}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-white/5"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="size-10 rounded shrink-0 object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded shrink-0 bg-[var(--surface-3)]" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-white/90">{p.name}</div>
                      <div className="truncate text-xs text-white/50">
                        Playlist · {p.creator}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 px-2 text-[11px] leading-relaxed text-white/40">
            Couldn&apos;t load chart playlists right now.
          </p>
        )}
      </section>
    </aside>
  );
}
