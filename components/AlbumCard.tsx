import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/lib/types";
import { pickImage } from "@/lib/types";

export default function AlbumCard({ album }: { album: Album }) {
  const img = pickImage(album.images, 300);
  return (
    <Link
      href={`/album/${album.id}`}
      className="group block rounded-md bg-[var(--surface-2)] p-3 transition hover:bg-[var(--surface-3)]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded shadow-lg">
        {img ? (
          <Image
            src={img}
            alt={album.name}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover"
          />
        ) : (
          <div className="size-full bg-[var(--surface-3)]" />
        )}
      </div>
      <div className="mt-3 min-w-0">
        <div className="truncate font-semibold text-sm">{album.name}</div>
        <div className="truncate text-xs text-white/60">
          {album.artists.map((a) => a.name).join(", ")}
        </div>
      </div>
    </Link>
  );
}
