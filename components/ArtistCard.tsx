import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/types";
import { pickImage } from "@/lib/types";

export default function ArtistCard({ artist }: { artist: Artist }) {
  const img = pickImage(artist.images, 300);
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group block rounded-md bg-[var(--surface-2)] p-3 transition hover:bg-[var(--surface-3)]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full shadow-lg">
        {img ? (
          <Image
            src={img}
            alt={artist.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-[var(--surface-3)]" />
        )}
      </div>
      <div className="mt-3 min-w-0">
        <div className="truncate font-semibold text-sm">{artist.name}</div>
        <div className="truncate text-xs text-white/60">Artist</div>
      </div>
    </Link>
  );
}
