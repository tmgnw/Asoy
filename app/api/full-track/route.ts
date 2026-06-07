import { NextRequest } from "next/server";

const AUDIUS_HOST = "https://discoveryprovider.audius.co";
const APP_NAME = "spotifyish";

type AudiusTrack = {
  id: string;
  title: string;
  user: { name: string; handle: string };
  duration: number;
  permalink?: string;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(feat\.?.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(
  candidate: AudiusTrack,
  targetTitle: string,
  targetArtist: string,
): number {
  const t = normalize(candidate.title);
  const a = normalize(candidate.user.name);
  const tt = normalize(targetTitle);
  const ta = normalize(targetArtist);

  let score = 0;

  // Title scoring
  if (t === tt) score += 10;
  else if (t.includes(tt)) score += 8; // Audius title often contains original title
  else if (tt.includes(t)) score += 4;

  // Artist scoring — community uploaders frequently put the original artist
  // in the track TITLE rather than their own username. Check both places.
  if (ta) {
    if (a === ta) score += 10;
    else if (a.includes(ta) || ta.includes(a)) score += 7;
    else if (t.includes(ta)) score += 5; // Original artist mentioned in title
  }

  return score;
}

function isCommunityUpload(uploaderName: string, targetArtist: string): boolean {
  if (!targetArtist) return false;
  const u = normalize(uploaderName);
  const a = normalize(targetArtist);
  // If uploader name is essentially the same as the original artist, treat as
  // official-on-Audius (some indie artists really do post under their own name).
  // Otherwise it's a community-uploaded cover/reupload of a major-label track.
  return !(u === a || u.includes(a) || a.includes(u));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title")?.trim();
  const artist = searchParams.get("artist")?.trim() ?? "";

  if (!title) {
    return Response.json({ streamUrl: null, reason: "missing title" }, { status: 400 });
  }

  const query = encodeURIComponent(`${artist} ${title}`.trim());

  try {
    const searchRes = await fetch(
      `${AUDIUS_HOST}/v1/tracks/search?query=${query}&app_name=${APP_NAME}`,
      { next: { revalidate: 3600 } },
    );
    if (searchRes.ok) {
      const data = (await searchRes.json()) as { data: AudiusTrack[] };
      const candidates = data.data ?? [];
      if (candidates.length > 0) {
        // Score and pick the best match. Require a minimum score so we don't
        // play wildly unrelated tracks (e.g. an indie cover of a different song).
        const scored = candidates
          .map((c) => ({ track: c, score: scoreMatch(c, title, artist) }))
          .sort((a, b) => b.score - a.score);

        const best = scored[0];
        if (best && best.score >= 10) {
          return Response.json({
            streamUrl: `${AUDIUS_HOST}/v1/tracks/${best.track.id}/stream?app_name=${APP_NAME}`,
            source: "audius",
            title: best.track.title,
            artist: best.track.user.name,
            durationMs: best.track.duration * 1000,
            score: best.score,
            isCommunityUpload: isCommunityUpload(best.track.user.name, artist),
          });
        }
      }
    }
  } catch {
    // fall through to YouTube
  }

  // Audius miss → look up a YouTube video ID. Public Invidious/Piped instances
  // are too flaky, and listType=search has been deprecated by YouTube since
  // 2018, so we scrape YouTube's HTML search-results page for the first
  // videoId. Fragile if YouTube changes its markup, but reliable today and
  // requires no API key.
  const searchQuery = `${artist} ${title}`.trim();
  const videoId = searchQuery ? await scrapeYoutubeFirstVideoId(searchQuery) : null;
  if (videoId) {
    return Response.json({
      streamUrl: null,
      youtubeVideoId: videoId,
      source: "youtube",
    });
  }

  return Response.json({
    streamUrl: null,
    reason: "no match on Audius or YouTube",
  });
}

async function scrapeYoutubeFirstVideoId(query: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query,
    )}`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: ctrl.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
