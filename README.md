# Asoy — Spotify-style web player (Next.js)

A frontend-only Spotify clone built with **Next.js 16 + Tailwind v4**. Uses the
**Deezer public API** as the music data source — no auth, no credentials, no
sign-up required.

> Originally targeted Spotify's Web API, but Spotify now requires the app
> owner to have **Premium** even for Client Credentials flow. Swapped to Deezer
> which has no such restriction and ships **30-sec previews for nearly every
> track**.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3003 (or whatever port the dev server prints).

That's it — no `.env.local`, no API keys.

## What works

- **Home** — Deezer's top global chart (24 albums).
- **Search** — search tracks, artists, and albums with a debounced URL-driven input.
- **Album page** — full tracklist with click-to-play.
- **Artist page** — header banner, top tracks, full discography.
- **Player** — bottom bar with shuffle/prev/play/next/repeat, seek, volume.
  Plays 30-second previews via HTML5 audio.

## What's intentionally NOT here

- **No user login.** This is a public-catalog clone — no Liked Songs, no
  personal playlists, no playback history. (Library shown in the sidebar is
  decorative.)
- **30-sec previews only.** Like every free music API, only short previews are
  available — full-song streaming requires user auth + a paid account on the
  provider.
- **No backend / database.** All requests hit Deezer directly from Next.js
  Server Components.

## Project structure

```
app/
  layout.tsx           3-panel shell (sidebar | main | player)
  page.tsx             Home — top chart
  search/page.tsx      Search across tracks/artists/albums
  album/[id]/page.tsx  Album detail with full tracklist
  artist/[id]/page.tsx Artist page with banner, top tracks, discography
components/
  PlayerProvider.tsx   Audio state via React Context
  Player.tsx           Bottom player UI
  Sidebar.tsx, AlbumCard.tsx, ArtistCard.tsx, TrackRow.tsx, SearchInput.tsx
lib/
  music.ts             Deezer API helpers (normalised into a generic shape)
  types.ts             Shared types & helpers
```

## Switching data providers

`lib/music.ts` normalises Deezer responses into a provider-agnostic shape
(`Album`, `Track`, `Artist`, `SearchResponse` in `lib/types.ts`). To swap in
another provider (Spotify with Premium, iTunes Search, MusicBrainz, etc.):

1. Re-implement the exported functions in `lib/music.ts` against the new API.
2. Add the provider's image hosts to `images.remotePatterns` in `next.config.ts`.
3. Nothing in `app/` or `components/` needs to change.

## Going further

- **User accounts + persistent playlists?** Add a database (Postgres + Prisma)
  and an auth provider (NextAuth/Auth.js).
- **Full-track streaming?** Use Spotify Web Playback SDK with OAuth (requires
  user Premium) or Deezer's Player SDK (requires partnership).
