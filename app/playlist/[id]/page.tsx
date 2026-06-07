import Image from "next/image";
import TrackRow from "@/components/TrackRow";
import { getPlaylist } from "@/lib/music";
import { pickImage } from "@/lib/types";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

function formatFans(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export default async function PlaylistPage({ params }: { params: Params }) {
  const { id } = await params;

  let playlist;
  try {
    playlist = await getPlaylist(id);
  } catch {
    notFound();
  }

  const cover = pickImage(playlist.images, 600);

  return (
    <div>
      <header className="flex flex-col gap-6 px-6 pt-10 pb-6 md:flex-row md:items-end md:px-8 md:pt-16 bg-gradient-to-b from-emerald-900/40 via-transparent to-transparent">
        {cover && (
          <Image
            src={cover}
            alt={playlist.name}
            width={232}
            height={232}
            className="size-48 md:size-56 rounded shadow-2xl object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide">Playlist</p>
          <h1 className="mt-2 text-3xl md:text-6xl font-extrabold tracking-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p
              className="mt-3 max-w-2xl text-sm text-white/70"
              dangerouslySetInnerHTML={{ __html: playlist.description }}
            />
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
            <span className="font-semibold">{playlist.creator}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">
              {formatFans(playlist.fans)} fans
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">
              {playlist.total_tracks} songs
            </span>
          </div>
        </div>
      </header>

      <section className="px-2 pb-10 md:px-4">
        <div className="hidden md:grid grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_56px] gap-4 px-3 py-2 text-xs uppercase tracking-wide text-white/50 border-b border-white/10">
          <div className="text-right">#</div>
          <div>Title</div>
          <div>Album</div>
          <div className="text-right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline">
              <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 5h-2v6l5 3 1-1.73-4-2.37V7Z" />
            </svg>
          </div>
        </div>
        <div className="mt-2">
          {playlist.tracks.items.map((t, i, arr) => (
            <TrackRow key={`${t.id}-${i}`} track={t} index={i} queue={arr} />
          ))}
        </div>
      </section>
    </div>
  );
}
