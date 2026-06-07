import Image from "next/image";
import Link from "next/link";
import TrackRow from "@/components/TrackRow";
import { getAlbum } from "@/lib/music";
import { pickImage } from "@/lib/types";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function AlbumPage({ params }: { params: Params }) {
  const { id } = await params;

  let album;
  try {
    album = await getAlbum(id);
  } catch {
    notFound();
  }

  const cover = pickImage(album.images, 600);

  return (
    <div>
      <header className="flex flex-col gap-6 px-6 pt-10 pb-6 md:flex-row md:items-end md:px-8 md:pt-16 bg-gradient-to-b from-indigo-900/40 via-transparent to-transparent">
        {cover && (
          <Image
            src={cover}
            alt={album.name}
            width={232}
            height={232}
            className="size-48 md:size-56 rounded shadow-2xl object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide">
            {album.album_type}
          </p>
          <h1 className="mt-2 text-3xl md:text-6xl font-extrabold tracking-tight">
            {album.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
            {album.artists.map((a, i) => (
              <span key={a.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-white/40">·</span>}
                <Link href={`/artist/${a.id}`} className="font-semibold hover:underline">
                  {a.name}
                </Link>
              </span>
            ))}
            <span className="text-white/40">·</span>
            <span className="text-white/70">{album.release_date.slice(0, 4)}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">{album.total_tracks} songs</span>
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
          {(() => {
            const withAlbum = album.tracks.items.map((t) => ({
              ...t,
              album: { id: album.id, name: album.name, images: album.images },
            }));
            return withAlbum.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                queue={withAlbum}
                showAlbum={false}
              />
            ));
          })()}
        </div>
        {album.copyrights && album.copyrights.length > 0 && (
          <div className="px-3 py-6 text-xs text-white/40">
            {album.copyrights.map((c, i) => (
              <p key={i}>{c.text}</p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
