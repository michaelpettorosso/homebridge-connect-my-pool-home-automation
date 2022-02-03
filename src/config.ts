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
    valves: ValveConfig[];
    lighting_zones: LightingZoneConfig[];
    favourites: FavouriteConfig[];
  }

export enum ChannelConfigFunction {
  FilterPump = 1,
  CleaningPump = 2,
  HeaterPump = 3,
  BoosterPump = 4,
  WaterfallPump = 5,
  FountainPump = 6,
  SpaPump = 7,
  SolarPump = 8,
  Blower = 9,
  Swimjet = 10,
  Jets = 11,
  SpaJets = 12,
  Overflow = 13,
  Spillway = 14,
  Audio = 15,
  HotSeat = 16,
  HeaterPower = 17,
  CustomName = 18,
}

export enum ValveConfigFunction {
  PoolSpa = 1,
  Solar = 2
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

export interface ValveConfig {
    valve_number: number;
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