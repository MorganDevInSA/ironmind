/**
 * Strict allowlist for opening YouTube from user-controlled strings (paste / query).
 * Blocks open redirects, javascript:, odd protocols, and non-YouTube hosts.
 */

const ALLOWED_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
]);

const DISALLOWED_CHARS = /[\r\n\x00\u202e\u200e\u200f]/;

export type TrainingYouTubePreset = {
  id: string;
  /** Plain playlist / mix name (without IronVibes prefix). */
  playlistName: string;
  /** Under 40 words; shown in preview before opening. */
  summary: string;
  url: string;
};

/** Title-case each whitespace-separated token for list labels (hyphen-only tokens preserved). */
function titleCasePlaylistWords(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  return s
    .split(/\s+/)
    .map((word) => {
      if (word === '-' || word === '–' || word === '—') return word;
      if (/^[A-Z]{2,4}$/.test(word)) return word;
      const tail = word.slice(1);
      if (tail.length > 0 && /[a-z]/.test(word) && /[A-Z]/.test(tail)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * UI title: `IronVibes - <Playlist Name>` when the stored name does not already include
 * “ironvibes”; playlist words are title-cased for consistent presentation.
 */
export function formatIronVibesTitle(playlistName: string): string {
  const t = titleCasePlaylistWords(playlistName);
  if (!t) return 'IronVibes';
  const compact = t.replace(/\s+/g, '').toLowerCase();
  if (compact.includes('ironvibes')) return t;
  return `IronVibes - ${t}`;
}

/** Extract `list` query value from a sanitized YouTube watch or playlist URL, if present. */
export function getYouTubePlaylistListId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get('list');
  } catch {
    return null;
  }
}

/** Whether `stored` refers to the same playlist as `presetUrl` (exact string or matching `list` id). */
export function trainingPresetUrlMatches(
  stored: string | null | undefined,
  presetUrl: string,
): boolean {
  if (!stored) return false;
  if (stored === presetUrl) return true;
  const a = getYouTubePlaylistListId(presetUrl);
  const b = getYouTubePlaylistListId(stored);
  return Boolean(a && b && a === b);
}

/** Curated IronVibes training mixes (canonical https URLs). */
export const TRAINING_YOUTUBE_PRESETS: readonly TrainingYouTubePreset[] = [
  {
    id: 'iv-thrash',
    playlistName: 'Thrash',
    summary:
      'Fast, aggressive metal riffing and tight drums—built for heavy compounds, AMRAP finishers, and sessions where you want maximum aggression without losing groove.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWLex8Jzgr3WjxwSb1SQVYt_',
  },
  {
    id: 'iv-dude-breakup',
    playlistName: 'Dude Breakup Music',
    summary:
      'Alt-leaning rock and emotional energy—steady tempos for moderate cardio, accessory supersets, or longer blocks where you want vocals and momentum without pure chaos.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWIbsA94EVtZYXeyBkZVFsci',
  },
  {
    id: 'iv-shared-breakup',
    playlistName: 'Shared Breakup Music',
    summary:
      'Shared, sentimental playlist energy—rhythmic and vocal-forward; good for zone-2 work, incline walks, or upper-body volume where mood matters as much as BPM.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWK3N2PDDJWGKYXGqvGiGY4l',
  },
  {
    id: 'iv-live-dnb',
    playlistName: 'Live DnB',
    summary:
      'Live drum-and-bass sets with rolling bass and fast hats—ideal for conditioning finishers, spin-style tempo, or high-rep circuits where you need nonstop drive.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWLdRl1lfOuYZVz1pJpzEv0a',
  },
  {
    id: 'iv-lift-groove',
    playlistName: 'Live Prog Psy',
    summary:
      'Progressive psy builds and melodic layers—steady climb for long compounds, incline work, or blocks where you want hypnotic forward motion without pure peak-time chaos.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWJqgfrbAfbAKbdozkH0VClA',
  },
  {
    id: 'iv-density',
    playlistName: 'Live Psy Tech',
    summary:
      'Psytech and driving four-on-the-floor energy—tight kicks and percussive detail for tempo work, machine stacks, or finishers where the groove stays clinical.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWLDNst3FSVerlDDomtCsDZ-',
  },
  {
    id: 'iv-live-psy',
    playlistName: 'Live PsyTrance',
    summary:
      'Live psytrance builds and hypnotic layers—great for endurance work, long warm-ups, or zone-style lifting where you want time to disappear inside the kick.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWK8CHbiO9rIbpE6lxEIxKLs',
  },
  {
    id: 'iv-eclectic-electronic',
    playlistName: 'Electronic blend',
    summary:
      'Eclectic electronic picks spanning BPMs—use when you want variety across supersets, unstructured gym time, or shared speakers without one narrow genre lock-in.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWKCGkbjcqzGpx2cThMGSt02',
  },
  {
    id: 'iv-memories',
    playlistName: 'Memories',
    summary:
      'Nostalgic, vocal-led tracks with emotional lift—steady enough for controlled hypertrophy, machine work, or cooldown walks while keeping heart rate honest.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWL1WAkwn_gbKBFXvlBA0S-k',
  },
  {
    id: 'iv-nano',
    playlistName: 'Nano',
    summary:
      'Tighter electronic “nano” sequencing—shorter tracks and quicker changes for circuits, EMOM blocks, or when you want the playlist to pace your rest automatically.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWJ2Bqpf651WHcdqZAZMiVOO',
  },
  {
    id: 'iv-nano-records',
    playlistName: 'Nano Records',
    summary:
      'Label-leaning psy and prog selections with polished production—focused sessions, pre-contest lifts, or headphone work where detail in the mix matters.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWIXBm7ALwUVRrjSv2Tp2KfT',
  },
  {
    id: 'iv-prog-psy',
    playlistName: 'Prog Psy',
    summary:
      'Progressive psy layers that climb slowly—perfect for long squat volumes, stair climbs, or any grind where you want energy to accrue instead of spike instantly.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWKkAqEjrJVJEOG6fu4MLaV-',
  },
  {
    id: 'iv-rock',
    playlistName: 'Rock',
    summary:
      'Guitar-forward rock runs with a strong mid-tempo pulse—anchors squats, presses, and classic bro-split days when you want riffs over four-on-the-floor kicks.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWK7zyssJujOnRp0Khnia3-f',
  },
  {
    id: 'iv-slow-electronic',
    playlistName: 'Slow Electronic',
    summary:
      'Downtempo and ambient electronic textures—mobility flows, post-leg cooldowns, or low-intensity cardio where recovery tone beats adrenaline.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWIOXd0SiFvZkkN7haU8OUgx',
  },
  {
    id: 'iv-80s',
    playlistName: '80s',
    summary:
      'Eighties cuts and synth-forward energy—steady drive for accessories, machine work, or longer blocks when you want nostalgic hooks without losing tempo.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWIPNSxBDL-9UUQ3Y6YycmR',
  },
  {
    id: 'iv-morgan-rock-anthems',
    playlistName: 'Rock Anthems',
    summary:
      'Arena-scale rock and sing-along hooks—pairs well with compounds, sled work, or any block where you want big guitars and steady drive.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWLILD8dx9c6r0UwVpcII-_D',
  },
  {
    id: 'iv-morgan-acoustic-rock',
    playlistName: 'Acoustic Rock',
    summary:
      'Unplugged and acoustic-led rock—lighter load days, warm-ups, mobility finishers, or upper-body accessories when you want tone over aggression.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWLH3SHaQbI5W5JGv7evWTe-',
  },
  {
    id: 'iv-morgan-ltks',
    playlistName: 'Volume Block',
    summary:
      'Rotating picks for longer sessions—stack with high-volume accessories, machine circuits, or shared-gym days when you need variety across the hour.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWIPsGFbLTks2vGLN0P0XvrG',
  },
  {
    id: 'iv-derry-girls-soundtrack',
    playlistName: 'Derry Girls - The Complete Soundtrack',
    summary:
      'Soundtrack-forward cuts with character and momentum—good for steady cardio, incline walks, or lighter training blocks when you want vocals and story in the mix.',
    url: 'https://www.youtube.com/playlist?list=PLIytxSNqh2PlL1q6Mh5ZyF1aU5glwUOUc',
  },
  {
    id: 'iv-morgan-dnb-short',
    playlistName: 'DnB',
    summary:
      'Drum-and-bass energy with rolling bass—use for fast tempos, spin-style finishers, or high-rep circuits where the kick keeps you honest.',
    url: 'https://www.youtube.com/playlist?list=PL3ESu9Aq2zWJrvzTQeqMpX7lTHflp8Ip3',
  },
] as const;

const MAX_URL_LEN = 2048;

function isAllowedYouTubePath(
  hostname: string,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  if (hostname === 'youtu.be') {
    const id = pathname.replace(/^\//, '').split('/')[0];
    return id.length === 11 && /^[\w-]+$/.test(id);
  }
  if (pathname === '/watch') {
    return searchParams.has('v') || searchParams.has('list');
  }
  if (pathname === '/playlist') {
    return searchParams.has('list');
  }
  if (pathname.startsWith('/embed/') || pathname.startsWith('/shorts/')) {
    return true;
  }
  if (pathname.startsWith('/live/')) {
    return true;
  }
  return false;
}

/** Drop unknown query keys to reduce open-redirect / tracking surprises inside YouTube. */
const ALLOWED_SEARCH_KEYS = new Set(['v', 'list', 'index', 't', 'start', 'end', 'si', 'pp']);

function stripDisallowedSearchParams(url: URL): void {
  for (const key of [...url.searchParams.keys()]) {
    if (!ALLOWED_SEARCH_KEYS.has(key)) url.searchParams.delete(key);
  }
}

/** Returns canonical https URL string or null if unsafe / invalid. */
export function sanitizeYouTubeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LEN) return null;
  if (DISALLOWED_CHARS.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (!ALLOWED_HOSTS.has(url.hostname)) return null;
  if (!isAllowedYouTubePath(url.hostname, url.pathname, url.searchParams)) return null;

  url.hash = '';
  stripDisallowedSearchParams(url);
  return url.toString();
}

export type YouTubeOpenResult = 'opened' | 'invalid' | 'blocked';

/** Opens in a new tab with isolation (user’s default handler for https in this browser). */
export function openYouTubeInNewTab(url: string): YouTubeOpenResult {
  const safe = sanitizeYouTubeUrl(url);
  if (!safe) return 'invalid';
  const win = window.open(safe, '_blank', 'noopener,noreferrer');
  return win ? 'opened' : 'blocked';
}
