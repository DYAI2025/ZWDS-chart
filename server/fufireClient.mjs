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

export async function geocodeWithFufire(query, language, config) {
  if (!config.FUFIRE_GEOCODE_PATH) {
    throw new UpstreamError('GEOCODE_NOT_CONFIGURED', 'Live geocoding is not configured.', 503, false);
  }
  const response = await upstreamJson(config, config.FUFIRE_GEOCODE_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, language, limit: 5 }),
  });
  if (!response || !Array.isArray(response.results)) {
    throw new UpstreamError('GEOCODE_CONTRACT_MISMATCH', 'The geocoding provider returned an unsupported response.', 502, false);
  }
  return response.results.map((item) => ({
    displayName: item.displayName,
    lat: item.lat,
    lon: item.lon,
    timezone: item.timezone,
    providerId: item.providerId ?? 'fufire',
    confidence: typeof item.confidence === 'number' ? item.confidence : null,
  }));
}