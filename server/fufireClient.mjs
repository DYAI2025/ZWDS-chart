import tzlookup from 'tz-lookup';

export class UpstreamError extends Error {
  constructor(code, message, status, retryable = false) {
    super(message);
    this.name = 'UpstreamError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function authenticationHeaders(config) {
  if (!config.FUFIRE_AUTH_HEADER || !config.FUFIRE_API_KEY) return {};
  const value = config.FUFIRE_AUTH_SCHEME
    ? `${config.FUFIRE_AUTH_SCHEME} ${config.FUFIRE_API_KEY}`
    : config.FUFIRE_API_KEY;
  return { [config.FUFIRE_AUTH_HEADER]: value };
}

async function upstreamJson(config, pathname, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.FUFIRE_TIMEOUT_MS);
  try {
    const response = await fetch(new URL(pathname, config.FUFIRE_BASE_URL), {
      ...init,
      headers: {
        accept: 'application/json',
        ...authenticationHeaders(config),
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new UpstreamError('FUFIRE_AUTH_FAILED', 'FuFirE authentication failed.', 502, false);
      if (response.status === 429) throw new UpstreamError('FUFIRE_RATE_LIMITED', 'FuFirE rate limit reached.', 503, true);
      if (response.status >= 400 && response.status < 500) throw new UpstreamError('FUFIRE_VALIDATION_FAILED', 'FuFirE rejected the request.', 502, false);
      throw new UpstreamError('FUFIRE_UPSTREAM_ERROR', 'FuFirE is temporarily unavailable.', 503, true);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UpstreamError('FUFIRE_TIMEOUT', 'FuFirE did not respond before the timeout.', 504, true);
    }
    throw new UpstreamError('FUFIRE_NETWORK_ERROR', 'FuFirE could not be reached.', 503, true);
  } finally {
    clearTimeout(timer);
  }
}

export function mapCalculateRequest(input, rulesetId) {
  return {
    birth: {
      datetime_local: `${input.date}T${input.time}:00`,
      timezone: input.location.timezone,
      location: { lat: input.location.lat, lon: input.location.lon },
      sex_at_birth: input.sexAtBirth,
      ambiguousTime: 'earlier',
      nonexistentTime: 'error',
    },
    calculation: {
      ruleset_id: rulesetId,
      direction_method: input.directionMethod,
      ...(input.directionMethod === 'explicit' ? { flow_direction: input.flowDirection } : {}),
    },
    output: {
      locale: input.locale,
      script_variant: 'ids_only',
      include_trace: true,
      include_decadal_limits: input.includeDecadalLimits,
      include_layout: false,
      include_catalog: false,
      star_scope: 'core',
    },
  };
}

export function calculateZwds(input, config) {
  return upstreamJson(config, '/v1/calculate/zwds', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(mapCalculateRequest(input, config.RULESET_ID)),
  });
}

export function fetchRulesetMetadata(rulesetId, config) {
  return upstreamJson(config, `/v1/metadata/zwds/rulesets/${encodeURIComponent(rulesetId)}`);
}

// --- Real FuFirE geocode contract (verified against api.fufire.space, 2026-07-17) ---
// POST <FUFIRE_GEOCODE_PATH> with body EXACTLY { place }. Any extra key => 422 extra_forbidden.
// 200 => a SINGLE object { lat, lon, resolved_name, confidence, timezone, country_code }.
// 422 { error:'ambiguous_place', candidates:[{ name, lat, lon, country_code, population }] }
//     — candidates carry NO timezone and NO confidence, so timezone is derived offline from lat/lon.

const clampConfidence = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null);

// Non-empty display name capped to the app schema's 160-char limit; '' signals "no usable name".
const boundedDisplayName = (name, countryCode) => {
  const base = name == null ? '' : String(name).trim();
  if (!base) return '';
  const combined = countryCode ? `${base}, ${countryCode}` : base;
  return combined.length > 160 ? combined.slice(0, 160).trim() : combined;
};

// Offline lat/lon -> IANA timezone. Returns a bounded non-empty string, or null when the
// coordinate is unusable (missing/non-finite) or tz-lookup throws (out-of-range coordinate).
const timezoneFromLatLon = (lat, lon) => {
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  try {
    const zone = tzlookup(lat, lon);
    if (!zone) return null;
    const bounded = String(zone).trim().slice(0, 80);
    return bounded || null;
  } catch {
    return null;
  }
};

const isPlaceNotFound = (body) =>
  Boolean(body) && typeof body.error === 'string' && /not[_-]?found|no[_-]?results?|unknown[_-]?place/i.test(body.error);

function mapSingleMatch(body) {
  const { lat, lon, resolved_name: resolvedName, confidence, timezone, country_code: countryCode } = body;
  if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  const displayName = boundedDisplayName(resolvedName, countryCode);
  const zone = (timezone && String(timezone).trim().slice(0, 80)) || timezoneFromLatLon(lat, lon);
  if (!displayName || !zone) return [];
  return [{ displayName, lat, lon, timezone: zone, providerId: 'fufire', confidence: clampConfidence(confidence) }];
}

function mapAmbiguousCandidates(candidates) {
  const results = [];
  for (const candidate of candidates) {
    if (results.length >= 5) break;
    if (!candidate) continue;
    const zone = timezoneFromLatLon(candidate.lat, candidate.lon);
    const displayName = boundedDisplayName(candidate.name, candidate.country_code);
    if (!zone || !displayName) continue; // skip candidates with missing coords or unresolvable timezone
    results.push({ displayName, lat: candidate.lat, lon: candidate.lon, timezone: zone, providerId: 'fufire', confidence: null });
  }
  return results;
}

export async function geocodeWithFufire(query, language, config) {
  if (!config.FUFIRE_GEOCODE_PATH) {
    throw new UpstreamError('GEOCODE_NOT_CONFIGURED', 'Live geocoding is not configured.', 503, false);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.FUFIRE_TIMEOUT_MS);
  try {
    // Direct fetch (not upstreamJson): the 422 ambiguous body is a REQUIRED result path, not an error.
    const response = await fetch(new URL(config.FUFIRE_GEOCODE_PATH, config.FUFIRE_BASE_URL), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...authenticationHeaders(config),
      },
      body: JSON.stringify({ place: query }), // ONLY place — extra keys => 422 extra_forbidden
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) {
      throw new UpstreamError('FUFIRE_AUTH_FAILED', 'FuFirE authentication failed.', 502, false);
    }
    let body = null;
    try { body = await response.json(); } catch { body = null; }

    if (response.status === 200 && body && typeof body === 'object' && !Array.isArray(body)) {
      return mapSingleMatch(body);
    }
    if (response.status === 422 && body && body.error === 'ambiguous_place' && Array.isArray(body.candidates)) {
      return mapAmbiguousCandidates(body.candidates); // empty candidates => [] (nothing found)
    }
    if (response.status === 404 || isPlaceNotFound(body)) {
      return []; // a valid "nothing found", not a fault
    }
    throw new UpstreamError('GEOCODE_CONTRACT_MISMATCH', 'The geocoding provider returned an unsupported response.', 502, false);
  } catch (error) {
    if (error instanceof UpstreamError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UpstreamError('FUFIRE_TIMEOUT', 'FuFirE did not respond before the timeout.', 504, true);
    }
    throw new UpstreamError('FUFIRE_NETWORK_ERROR', 'FuFirE could not be reached.', 503, true);
  } finally {
    clearTimeout(timer);
  }
}