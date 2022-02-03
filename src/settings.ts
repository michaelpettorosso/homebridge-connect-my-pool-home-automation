/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'ConnectMyPoolHomeAutomation';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-connect-my-pool-home-automation';

export const BASE_URL = 'https://www.connectmypool.com.au/api/';

export const MANUFACTURER = 'Astral';

export const API_INTERVAL = 60000;

export enum TemperatureScale {
  CELSIUS = 0,
  FAHRENHEIT = 1
}

export const MIN_TEMP = 5;
export const MIN_TARGET_TEMP = 10;
export const MAX_TEMP = 40;
export const MAX_TARGET_TEMP = 40;

export enum HeatersMode {
  OFF = 0,
  ON = 1
}

export enum PoolSpaSelection {
  SPA = 0,
  POOL = 1
}

export enum SolarSystemMode {
  OFF = 0,
  AUTO = 1,
  ON = 2
}

export enum ChannelsMode {
  OFF = 0,
  AUTO = 1,
  ON = 2,
  LOW_SPEED = 3,
  MEDIUM_SPEED = 4,
  HIGH_SPEED = 5
}

export enum ValveMode {
  OFF = 0,
  AUTO = 1,
  ON = 2
}

export enum LightingMode {
  OFF = 0,
  AUTO = 1,
  ON = 2
}

export const LIGHTING_COLOR_USER_1 = 8;