export interface PoolConfig {
    pool_spa_selection_enabled: boolean;
    heat_cool_selection_enabled: boolean;
    has_heaters: boolean;
    has_solar_systems: boolean;
    has_channels: boolean;
    has_valves: boolean;
    has_lighting_zones: boolean;
    has_favourites: boolean;
    heaters: HeaterConfig[];
    solar_systems: SolarSystemConfig[];
    channels: ChannelConfig[];
    valves: [];
    lighting_zones: LightingZoneConfig[];
    favourites: FavouriteConfig[];
  }

export interface HeaterConfig {
    heater_number: number;
  }

export interface SolarSystemConfig {
    solar_number: number;
  }

export interface ChannelConfig {
    channel_number: number;
    function: number;
    name: string;
  }

export interface LightingZoneConfig {
    lighting_zone_number: number;
    name: string;
    color_enabled: boolean;
    colors_available: ColorsAvailableConfig[];
  }

export interface ColorsAvailableConfig {
    color_number: number;
    color_name: string;
  }

export interface FavouriteConfig {
    favourite_number: number;
    name: string;
  }
