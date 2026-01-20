export interface PollingConfig {
  intervalMs?: number;
  maxIntervalMs?: number;
  backoffMultiplier?: number;
  jitterPercent?: number;
}

export interface RateLimitConfig {
  minIntervalMs?: number;
}

export interface SolarConfig {
  lat?: number;
  lon?: number;
  startMonth?: number;  // 0 = Jan
  endMonth?: number;    // 11 = Dec
  cloudLimit?: number;  // %
  weatherApiKey?: string;
}

export interface PlatformConfigExtended {
  platform: string;
  apiKey?: string;
  baseUrl?: string;
  polling?: PollingConfig;
  rateLimit?: RateLimitConfig
  solarConfig?: SolarConfig
}

