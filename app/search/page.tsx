import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import SearchInput from "@/components/SearchInput";
import TrackRow from "@/components/TrackRow";
import { search } from "@/lib/music";
import { Suspense } from "react";

type SP = Promise<{ q?: string }>;

async function Results({ q }: { q: string }) {
  let data: Awaited<ReturnType<typeof search>> | null = null;
  let error: string | null = null;
  try {
    data = await search(q);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed";
  }
  if (error) {
    return (
      <div className="rounded-lg bg-red-900/30 border border-red-700/40 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }
  if (!data) return null;
  const { tracks, artists, albums } = data;
  const empty =
    tracks.items.length === 0 &&
    artists.items.length === 0 &&
    albums.items.length === 0;
  if (empty) {
    return (
      <p className="text-white/60">
        No results for &ldquo;{q}&rdquo;. Try a different keyword.
      </p>
    );
  }
  return (
    <div className="space-y-10">
      {tracks.items.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Songs</h2>
          <div className="rounded-md bg-[var(--surface-2)]/40 p-1">
            {tracks.items.slice(0, 8).map((t, i, arr) => (
              <TrackRow key={t.id} track={t} index={i} queue={arr} />
            ))}
          </div>
        </section>
      )}
      {artists.items.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Artists</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {artists.items.slice(0, 6).map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
      {albums.items.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Albums</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {albums.items.slice(0, 6).map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return (
    <div className="px-6 py-6 md:px-8">
      <header className="mb-6">
        <Suspense fallback={null}>
          <SearchInput />
        </Suspense>
      </header>
      {query.length === 0 ? (
        <p className="text-white/60">
          Type something above to search the catalog.
        </p>
      ) : (
        <Suspense
          key={query}
          fallback={<p className="text-white/60">Searching…</p>}
        >
          <Results q={query} />
        </Suspense>
      )}
    </div>
  );
}
