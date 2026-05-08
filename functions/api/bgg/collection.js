import { getBggCollection } from 'bgg-xml-api-client';

/**
 * Transform a raw BGG collection item into the clean shape the app needs.
 * Handles the quirks of fast-xml-parser output (OfValue wrappers, SingleOrMany, etc.)
 */
function transformItem(item) {
  const stats = item.stats ?? {};
  const rating = stats.rating ?? {};

  // Community average rating — stored as OfValue<number>, so read .value
  const averageRaw = rating.average;
  const communityRating =
    averageRaw != null && typeof averageRaw === 'object' && 'value' in averageRaw
      ? Number(averageRaw.value) || 0
      : Number(averageRaw) || 0;

  // User's own rating — stored as a plain string ("N/A" or a numeric string)
  const userRatingRaw = rating.value;
  const userRating =
    userRatingRaw == null || userRatingRaw === 'N/A' || userRatingRaw === ''
      ? null
      : Number(userRatingRaw) || null;

  // Name — stored as { text: string, sortindex: number }
  const nameObj = item.name ?? {};
  const name = typeof nameObj === 'string' ? nameObj : (nameObj.text ?? nameObj.value ?? '');

  return {
    id: String(item.objectid ?? ''),
    name,
    thumbnail: item.thumbnail ?? '',
    minPlayers: Number(stats.minplayers) || 0,
    maxPlayers: Number(stats.maxplayers) || 0,
    playingTime: Number(stats.playingtime) || 0,
    minPlayTime: Number(stats.minplaytime) || 0,
    maxPlayTime: Number(stats.maxplaytime) || 0,
    // averageweight is not available on the collection endpoint (only on the Thing endpoint).
    // Set to 0 here; a future enhancement can fetch weights separately.
    weight: 0,
    communityRating,
    userRating,
    numPlays: Number(item.numplays) || 0,
  };
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response(JSON.stringify({ error: 'username is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authorizationKey = context.env.BGG_AUTH_KEY;

  if (!authorizationKey) {
    return new Response(JSON.stringify({ error: 'BGG_AUTH_KEY is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const collection = await getBggCollection(
      {
        username,
        own: 1,
        excludesubtype: 'boardgameexpansion',
        stats: 1,
      },
      {
        authorizationKey,
        maxRetries: 10,
        retryInterval: 5000,
        timeout: 30000,
      }
    );

    // BGG sometimes returns a <message> XML with status 200 instead of 202
    // when the collection is queued. The library parses that as a plain string.
    // Treat it as a retry signal rather than silently returning 0 games.
    if (typeof collection !== 'object' || collection === null) {
      return new Response(
        JSON.stringify({ error: 'BGG is still processing your collection. Please try again in a few seconds.' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // collection.item may be a single object (if only 1 game) or an array
    const rawItems = collection.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    const games = items.map(transformItem);

    return new Response(JSON.stringify(games), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // BGG returns 202 when the collection is still being generated — the library
    // retries automatically, but if max retries are exhausted it throws with this message.
    if (message.includes('Max retries reached')) {
      return new Response(
        JSON.stringify({ error: 'BGG is still processing the collection. Please try again in a few seconds.' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'BGG API error', detail: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
