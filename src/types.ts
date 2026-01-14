export interface PollingConfig {
  baseIntervalMs?: number;
  maxIntervalMs?: number;
  backoffMultiplier?: number;
  jitterFraction?: number;
}

export type AccessoryType = 'light' | 'channel' | 'heater' | 'solar' | 'valve' | 'favourite';

export type Mode = 'off' | 'on' | 'auto'; //no auto for thermostat

export interface RemoteAccessoryConfig {
  id: string;
  name: string;
  type: AccessoryType;
  mode: Mode;
}


export interface PlatformConfigExtended {
  platform: string;
  apiKey?: string;
  baseUrl?: string;
  polling?: PollingConfig;
  accessories?: RemoteAccessoryConfig[];
}

export interface PoolConfigResponse {
  pool_spa_selection_enabled: boolean;
  heat_cool_selection_enabled: boolean;
  has_heaters: boolean;
  has_solar_systems: boolean;
  has_channels: boolean;
  has_valves: boolean;
  has_lighting_zones: boolean;
  has_favourites: boolean;
  lighting_zones?: Array<{ 
    lighting_zone_number: number; 
    name: string; 
    color_enabled: boolean;
	colors_available?: Array<{
		color_number: number;
		color_name: string;
    }>    
  }>;
  heaters?: Array<{ 
    heater_number: number; 
  }>;

  solar_systems?: Array<{
    solar_number: number;
  }>;
  channels?: Array<{ 
    channel_number: number; 
    function: number;
    name: string;
  }>;
  valves?: Array<{ 
    valve_number: number; 
    function: number;
    name: string;
  }>;
  favourites?: Array<{ 
    favourite_number: number; 
    name: string 
  }>;
}

export interface PoolStatusResponse {
  pool_spa_selection: number;
  heat_cool_selection: number;
  temperature: number;
  active_favourite: number;
  lighting_zones?: Array<{ 
    lighting_zone_number: number; 
    mode: number;
    color: number
  }>;
  channels?: Array<{ 
    channel_number: number; 
    mode: number;
  }>;
  heaters?: Array<{
    heater_number: number;
    mode: number;
    set_temperature?: number;
    spa_set_temperature?: number;

  }>;
  solar_systems?: Array<{
    solar_number: number;
    mode: number;
    set_temperature?: number;
  }>;
  valves?: Array<{ 
    valve_number: number; 
    mode: number; 
  }>;
}

