import "server-only";
import type {
  Album,
  AlbumDetail,
  Artist,
  Playlist,
  PlaylistDetail,
  SearchResponse,
  Track,
} from "./types";

const API = "https://api.deezer.com";

type DeezerImage = {
  picture_small?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  cover_small?: string;
  cover_medium?: string;
  cover_big?: string;
  cover_xl?: string;
};

type DeezerArtist = DeezerImage & {
  id: number;
  name: string;
  nb_fan?: number;
  picture?: string;
};

type DeezerAlbum = DeezerImage & {
  id: number;
  title: string;
  cover?: string;
  release_date?: string;
  nb_tracks?: number;
  record_type?: string;
  artist?: DeezerArtist;
  tracks?: { data: DeezerTrack[] };
  genres?: { data: { id: number; name: string }[] };
  label?: string;
};

type DeezerPlaylist = DeezerImage & {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  nb_tracks?: number;
  fans?: number;
  creator?: { id: number; name: string };
  user?: { id: number; name: string };
  picture?: string;
  tracks?: { data: DeezerTrack[] };
};

type DeezerTrack = {
  id: number;
  title: string;
  duration: number; // seconds
  preview: string;
  explicit_lyrics?: boolean;
  track_position?: number;
  artist: DeezerArtist;
  album?: DeezerAlbum;
};

async function dz<T>(path: string, revalidate = 60): Promise<T> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`Deezer ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as T & { error?: { message: string; code: number } };
  if ((data as { error?: { message: string } }).error) {
    throw new Error((data as { error: { message: string } }).error.message);
  }
  return data;
}

// ----- normalizers -----

function imagesFromAlbum(a: DeezerAlbum) {
  const list = [
    { url: a.cover_xl, w: 1000 },
    { url: a.cover_big, w: 500 },
    { url: a.cover_medium, w: 250 },
    { url: a.cover_small, w: 56 },
    { url: a.cover, w: 250 },
  ]
    .filter((x): x is { url: string; w: number } => Boolean(x.url))
    .map(({ url, w }) => ({ url, width: w, height: w }));
  return list;
}

function imagesFromPlaylist(p: DeezerPlaylist) {
  const list = [
    { url: p.picture_xl, w: 1000 },
    { url: p.picture_big, w: 500 },
    { url: p.picture_medium, w: 250 },
    { url: p.picture_small, w: 56 },
    { url: p.picture, w: 250 },
  ]
    .filter((x): x is { url: string; w: number } => Boolean(x.url))
    .map(({ url, w }) => ({ url, width: w, height: w }));
  return list;
}

function normalizePlaylist(p: DeezerPlaylist): Playlist {
  const creator = p.creator?.name ?? p.user?.name ?? "Deezer";
  return {
    id: String(p.id),
    name: p.title,
    description: p.description ?? "",
    images: imagesFromPlaylist(p),
    creator,
    total_tracks: p.nb_tracks ?? p.tracks?.data.length ?? 0,
    fans: p.fans ?? 0,
  };
}

function imagesFromArtist(a: DeezerArtist) {
  const list = [
    { url: a.picture_xl, w: 1000 },
    { url: a.picture_big, w: 500 },
    { url: a.picture_medium, w: 250 },
    { url: a.picture_small, w: 56 },
    { url: a.picture, w: 250 },
  ]
    .filter((x): x is { url: string; w: number } => Boolean(x.url))
    .map(({ url, w }) => ({ url, width: w, height: w }));
  return list;
}

function normalizeArtistRef(a: DeezerArtist) {
  return { id: String(a.id), name: a.name };
}

function normalizeAlbum(a: DeezerAlbum): Album {
  return {
    id: String(a.id),
    name: a.title,
    album_type: a.record_type ?? "album",
    release_date: a.release_date ?? "",
    total_tracks: a.nb_tracks ?? a.tracks?.data.length ?? 0,
    images: imagesFromAlbum(a),
    artists: a.artist ? [normalizeArtistRef(a.artist)] : [],
  };
}

function normalizeTrack(t: DeezerTrack, albumOverride?: DeezerAlbum): Track {
  const album = albumOverride ?? t.album;
  return {
    id: String(t.id),
    name: t.title,
    duration_ms: t.duration * 1000,
    preview_url: t.preview || null,
    explicit: Boolean(t.explicit_lyrics),
    artists: [normalizeArtistRef(t.artist)],
    track_number: t.track_position,
    album: album
      ? { id: String(album.id), name: album.title, images: imagesFromAlbum(album) }
      : undefined,
  };
}

function normalizeArtist(a: DeezerArtist): Artist {
  return {
    id: String(a.id),
    name: a.name,
    images: imagesFromArtist(a),
    followers: { total: a.nb_fan ?? 0 },
    genres: [],
    popularity: 0,
  };
}

// ----- public API -----

export function hasMusicProvider() {
  // Deezer requires no credentials — always available.
  return true;
}

export async function getNewReleases(limit = 24): Promise<Album[]> {
  const data = await dz<{ data: DeezerAlbum[] }>(`/chart/0/albums?limit=${limit}`);
  return data.data.map(normalizeAlbum);
}

export async function getTopTracks(limit = 10): Promise<Track[]> {
  const data = await dz<{ data: DeezerTrack[] }>(`/chart/0/tracks?limit=${limit}`);
  return data.data.map((t) => normalizeTrack(t));
}

export async function getTopArtists(limit = 10): Promise<Artist[]> {
  // The chart endpoint returns rank+name+picture only — no fan count. We
  // fetch each artist's detail to show "X fans" on the leaderboard, but
  // Deezer rate-limits bursts ("Quota limit exceeded") so we batch with a
  // small concurrency window instead of firing all 10 at once.
  const chart = await dz<{ data: DeezerArtist[] }>(`/chart/0/artists?limit=${limit}`);
  const concurrency = 2;
  const detailed: DeezerArtist[] = [];
  for (let i = 0; i < chart.data.length; i += concurrency) {
    const batch = chart.data.slice(i, i + concurrency);
    const settled = await Promise.all(
      batch.map(async (a) => {
        try {
          return await dz<DeezerArtist>(`/artist/${a.id}`, 3600);
        } catch {
          return a; // Fallback: keep chart entry, leaderboard still shows rank/name/img
        }
      }),
    );
    detailed.push(...settled);
  }
  return detailed.map(normalizeArtist);
}

export async function getAlbum(id: string): Promise<AlbumDetail> {
  const a = await dz<DeezerAlbum & { copyrights?: never; label?: string }>(`/album/${id}`);
  const base = normalizeAlbum(a);
  const tracks = (a.tracks?.data ?? []).map((t) => normalizeTrack(t, a));
  return {
    ...base,
    label: a.label,
    tracks: { items: tracks },
    copyrights: a.label ? [{ text: `© ${a.label}`, type: "C" }] : [],
  };
}

export async function getArtist(id: string): Promise<Artist> {
  const a = await dz<DeezerArtist>(`/artist/${id}`);
  return normalizeArtist(a);
}

export async function getArtistTopTracks(id: string): Promise<Track[]> {
  const data = await dz<{ data: DeezerTrack[] }>(`/artist/${id}/top?limit=10`);
  return data.data.map((t) => normalizeTrack(t));
}

export async function getArtistAlbums(id: string, limit = 12): Promise<Album[]> {
  const data = await dz<{ data: DeezerAlbum[] }>(`/artist/${id}/albums?limit=${limit}`);
  // Deezer returns artist-less albums in this list; inject artist ref.
  const artist = await dz<DeezerArtist>(`/artist/${id}`);
  return data.data.map((a) => normalizeAlbum({ ...a, artist }));
}

export async function getTopPlaylists(limit = 10): Promise<Playlist[]> {
  const data = await dz<{ data: DeezerPlaylist[] }>(
    `/chart/0/playlists?limit=${limit}`,
  );
  return data.data.map(normalizePlaylist);
}

export async function getPlaylist(id: string): Promise<PlaylistDetail> {
  const p = await dz<DeezerPlaylist>(`/playlist/${id}`);
  const base = normalizePlaylist(p);
  const tracks = (p.tracks?.data ?? []).map((t) => normalizeTrack(t));
  return { ...base, tracks: { items: tracks } };
}

export async function search(query: string, limit = 12): Promise<SearchResponse> {
  const q = encodeURIComponent(query);
  const [tracksRes, artistsRes, albumsRes] = await Promise.all([
    dz<{ data: DeezerTrack[] }>(`/search/track?q=${q}&limit=${limit}`, 30),
    dz<{ data: DeezerArtist[] }>(`/search/artist?q=${q}&limit=${limit}`, 30),
    dz<{ data: DeezerAlbum[] }>(`/search/album?q=${q}&limit=${limit}`, 30),
  ]);
  return {
    tracks: { items: tracksRes.data.map((t) => normalizeTrack(t)) },
    artists: { items: artistsRes.data.map(normalizeArtist) },
    albums: { items: albumsRes.data.map(normalizeAlbum) },
  };
}
