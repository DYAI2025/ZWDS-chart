import { z } from 'zod';
import { geocodeWithFufire } from './fufireClient.mjs';

const geocodeResultSchema = z.object({
  displayName: z.string().min(1).max(160),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string().min(1).max(80),
  providerId: z.string().min(1).max(80),
  confidence: z.number().min(0).max(1).nullable(),
}).strict();

const FIXTURE_LOCATIONS = [
  { displayName: 'Shanghai, China', lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai', providerId: 'fixture-gazetteer', confidence: 1 },
  { displayName: 'Taipei, Taiwan', lat: 25.033, lon: 121.5654, timezone: 'Asia/Taipei', providerId: 'fixture-gazetteer', confidence: 1 },
  { displayName: 'Berlin, Germany', lat: 52.52, lon: 13.405, timezone: 'Europe/Berlin', providerId: 'fixture-gazetteer', confidence: 1 },
  { displayName: 'Wien, Österreich', lat: 48.2082, lon: 16.3738, timezone: 'Europe/Vienna', providerId: 'fixture-gazetteer', confidence: 1 },
];

export class FixtureGeocodeProvider {
  async search(query) {
    const normalized = query.toLocaleLowerCase();
    return FIXTURE_LOCATIONS.filter((entry) => entry.displayName.toLocaleLowerCase().includes(normalized)).slice(0, 5);
  }
}

export class FufireGeocodeProvider {
  constructor(config) { this.config = config; }
  async search(query, language) {
    const results = await geocodeWithFufire(query, language, this.config);
    return z.array(geocodeResultSchema).max(5).parse(results);
  }
}

export function createGeocodeProvider(config) {
  return config.FUFIRE_MODE === 'live' ? new FufireGeocodeProvider(config) : new FixtureGeocodeProvider();
}