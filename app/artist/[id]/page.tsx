import Image from "next/image";
import AlbumCard from "@/components/AlbumCard";
import TrackRow from "@/components/TrackRow";
import {
  getArtist,
  getArtistAlbums,
  getArtistTopTracks,
} from "@/lib/music";
import { pickImage } from "@/lib/types";
import { notFound } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function ArtistPage({ params }: { params: Params }) {
  const { id } = await params;

  let artist, tracks, albums;
  try {
    [artist, tracks, albums] = await Promise.all([
      getArtist(id),
      getArtistTopTracks(id),
      getArtistAlbums(id),
    ]);
  } catch {
    notFound();
  }

  const img = pickImage(artist.images, 600);
  const followers = artist.followers.total.toLocaleString("en-US");

  return (
    <div>
      <header className="relative h-72 md:h-96 overflow-hidden">
        {img && (
          <Image
            src={img}
            alt={artist.name}
            fill
            sizes="100vw"
            className="object-cover object-center opacity-70"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#3D91F4">
              <path d="M12 2 9.91 8.36 3 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-6.91-.91L12 2Z" />
            </svg>
            Verified Artist
          </p>
          <h1 className="mt-2 text-4xl md:text-7xl font-black tracking-tight">
            {artist.name}
          </h1>
          <p className="mt-3 text-sm text-white/80">{followers} fans on Deezer</p>
        </div>
      </header>

      <div className="px-6 py-8 md:px-8 space-y-10">
        <section>
          <h2 className="mb-3 text-xl font-bold">Popular</h2>
          <div className="rounded-md bg-[var(--surface-2)]/30 p-1">
            {tracks.slice(0, 5).map((t, i, arr) => (
              <TrackRow key={t.id} track={t} index={i} queue={arr} />
            ))}
          </div>
        </section>

        {albums.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">Discography</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {albums.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          </section>
        )}

        {artist.genres.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-bold">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {artist.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
