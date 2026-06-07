export type SpotifyImage = { url: string; height: number | null; width: number | null };

export type ArtistRef = { id: string; name: string };

export type Album = {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  total_tracks: number;
  images: SpotifyImage[];
  artists: ArtistRef[];
};

export type Track = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  explicit: boolean;
  artists: ArtistRef[];
  album?: { id: string; name: string; images: SpotifyImage[] };
  track_number?: number;
};

export type AlbumDetail = Album & {
  tracks: { items: Track[] };
  label?: string;
  copyrights?: { text: string; type: string }[];
  popularity?: number;
};

export type Artist = {
  id: string;
  name: string;
  images: SpotifyImage[];
  followers: { total: number };
  genres: string[];
  popularity: number;
};

export type SearchResponse = {
  tracks: { items: Track[] };
  artists: { items: Artist[] };
  albums: { items: Album[] };
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  creator: string;
  total_tracks: number;
  fans: number;
};

export type PlaylistDetail = Playlist & {
  tracks: { items: Track[] };
};

export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function pickImage(images: SpotifyImage[] | undefined, prefer = 300) {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort(
    (a, b) => Math.abs((a.width ?? 0) - prefer) - Math.abs((b.width ?? 0) - prefer),
  );
  return sorted[0]?.url ?? images[0]?.url ?? null;
}
