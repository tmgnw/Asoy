import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/types";
import { pickImage } from "@/lib/types";

function rankStyle(rank: number) {
  if (rank === 1) return "from-yellow-400/30 to-yellow-600/10 text-yellow-300";
  if (rank === 2) return "from-zinc-300/30 to-zinc-500/10 text-zinc-200";
  if (rank === 3) return "from-amber-700/40 to-amber-900/10 text-amber-300";
  return "from-white/5 to-white/0 text-white/60";
}

function formatFans(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export default function ArtistLeaderboard({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) return null;
  const [top1, top2, top3, ...rest] = artists;
  return (
    <div className="space-y-4">
      {/* Podium row — top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[top1, top2, top3].filter(Boolean).map((a, i) => {
          const rank = i + 1;
          const img = pickImage(a.images, 500);
          return (
            <Link
              key={a.id}
              href={`/artist/${a.id}`}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${rankStyle(
                rank,
              )} border border-white/10 p-4 transition hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {img && (
                    <Image
                      src={img}
                      alt={a.name}
                      width={80}
                      height={80}
                      className="size-20 rounded-full object-cover ring-2 ring-white/20"
                    />
                  )}
                  <div className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-black text-xs font-black ring-2 ring-current">
                    #{rank}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide opacity-70">
                    {rank === 1 ? "Top 1 trending" : `#${rank} trending`}
                  </div>
                  <div className="truncate text-lg font-bold text-white">
                    {a.name}
                  </div>
                  <div className="text-xs text-white/60">
                    {a.followers.total > 0 ? `${formatFans(a.followers.total)} fans` : "Verified trending"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Rest of the leaderboard */}
      {rest.length > 0 && (
        <ol className="rounded-xl bg-[var(--surface-2)]/40 border border-white/5 overflow-hidden">
          {rest.map((a, i) => {
            const rank = i + 4;
            const img = pickImage(a.images, 250);
            return (
              <li key={a.id}>
                <Link
                  href={`/artist/${a.id}`}
                  className="grid grid-cols-[40px_56px_1fr_auto] items-center gap-4 px-4 py-2.5 transition hover:bg-white/5"
                >
                  <span className="text-xl font-bold tabular-nums text-white/40">
                    {rank}
                  </span>
                  {img ? (
                    <Image
                      src={img}
                      alt={a.name}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-[var(--surface-3)]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {a.name}
                    </div>
                    <div className="text-xs text-white/50">Artist</div>
                  </div>
                  <div className="text-xs text-white/60 tabular-nums">
                    {a.followers.total > 0 ? `${formatFans(a.followers.total)} fans` : "—"}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
