import AlbumCard from "@/components/AlbumCard";
import ArtistLeaderboard from "@/components/ArtistLeaderboard";
import TrackRow from "@/components/TrackRow";
import { getNewReleases, getTopArtists, getTopTracks } from "@/lib/music";
import type { Album, Artist, Track } from "@/lib/types";

export default async function Home() {
  let topTracks: Track[] = [];
  let topArtists: Artist[] = [];
  let albums: Album[] = [];
  let error: string | null = null;

  try {
    [topTracks, topArtists, albums] = await Promise.all([
      getTopTracks(10),
      getTopArtists(10),
      getNewReleases(12),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  return (
    <div className="px-6 py-6 md:px-8 space-y-10 pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Good evening</h1>
        <p className="mt-1 text-sm text-white/60">
          What the world is listening to right now — global charts, refreshed
          every minute.
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700/40 p-4 text-sm text-red-200">
          <p className="font-semibold">Couldn&apos;t load the chart.</p>
          <p className="mt-1 text-red-300/80">{error}</p>
          <p className="mt-2 text-xs text-red-300/60">
            Deezer&apos;s public API rate-limits aggressive callers. Wait a
            moment and refresh.
          </p>
        </div>
      )}

      {topTracks.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Top Songs Right Now
              </h2>
              <p className="text-xs text-white/60">
                Lagu yang paling sering didengar di seluruh dunia. Click to
                preview.
              </p>
            </div>
            <span className="hidden sm:block shrink-0 text-[10px] uppercase tracking-wider text-white/50">
              Global · Live
            </span>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)]/40 border border-white/5 p-1">
            {topTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={topTracks} />
            ))}
          </div>
        </section>
      )}

      {topArtists.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Trending Artists 🔥
              </h2>
              <p className="text-xs text-white/60">
                Penyanyi yang lagi naik daun — leaderboard berdasarkan jumlah
                pendengar saat ini.
              </p>
            </div>
            <span className="hidden sm:block shrink-0 text-[10px] uppercase tracking-wider text-white/50">
              Updated live
            </span>
          </div>
          <ArtistLeaderboard artists={topArtists} />
        </section>
      )}

      {albums.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Featured Albums
            </h2>
            <p className="text-xs text-white/60">
              Album yang paling banyak dimainkan minggu ini.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
