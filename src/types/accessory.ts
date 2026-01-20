import { ChannelMode, ChannelType } from "../channel/types";
import { ColorAvailable, LightingZoneMode } from "../lightingzone/types";
import { HeaterMode } from "../heater/types";

import { PoolSpaSelection, HeatCoolSelection } from "../heater/types";
import { SolarConfig } from "./config";

export type Mode = 'off' | 'on'; 

// Base interface for common properties
export interface BaseAccessoryConfig {
  id: string;
  name: string;
  type: AccessoryType
}

// Accessory types enum
export enum AccessoryType {
  Heater = 'heater',
  Light = 'light',
  Channel = 'channel',
  Valve = 'valve',
  Favourite = 'favourite',
}

// Heater-specific fields
export interface HeaterAccessoryConfig extends BaseAccessoryConfig {
  type: AccessoryType.Heater;
  poolSpaSelectionEnabled: boolean;
  heatCoolSelectionEnabled: boolean;
  solarId: number;
  solarConfig?: SolarConfig;
}

// Light-specific fields
export interface LightAccessoryConfig extends BaseAccessoryConfig {
  type: AccessoryType.Light;
  color_enabled: boolean;
  colors_available?: ColorAvailable[];
}

// Channel-specific fields
export interface ChannelAccessoryConfig extends BaseAccessoryConfig {
  type: AccessoryType.Channel;
  function: ChannelType
}

// Valve-specific fields
export interface ValveAccessoryConfig extends BaseAccessoryConfig {
  type: AccessoryType.Valve;
}

// Favourite-specific fields
export interface FavouriteAccessoryConfig extends BaseAccessoryConfig {
  type: AccessoryType.Favourite;
}


// Union of all accessory configs
export type AccessoryConfig =
  | HeaterAccessoryConfig
  | LightAccessoryConfig
  | ChannelAccessoryConfig
  | ValveAccessoryConfig
  | FavouriteAccessoryConfig;


  // Base interface for common properties
export interface BaseAccessoryStatus {
}

export interface HeaterAccessoryStatus extends BaseAccessoryStatus {
  mode: HeaterMode
  pool_spa_selection:	PoolSpaSelection,
	heat_cool_selection:	HeatCoolSelection,
	temperature: number,
  set_temperature: number,
	spa_set_temperature:	number,
  solar_set_temperature?: number
}

export interface ChannelAccessoryStatus extends BaseAccessoryStatus {
  mode: ChannelMode
}

export interface ValveAccessoryStatus extends BaseAccessoryStatus {
}


export interface LightZoneAccessoryStatus extends BaseAccessoryStatus {
  mode: number,
  colour_enabled: boolean, 
  colour?: ColorAvailable,
  colors_available?: [Record<ColorAvailable, string>]
}

export interface FavouriteAccessoryStatus extends BaseAccessoryStatus {
  active_favourite:	255,
}

// Union of all accessory statuses
export type AccessoryStatus =
  | HeaterAccessoryStatus
  | LightZoneAccessoryStatus
  | ChannelAccessoryStatus
  | ValveAccessoryStatus
  | FavouriteAccessoryStatus;
