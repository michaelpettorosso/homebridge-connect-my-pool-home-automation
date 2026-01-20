import { ChannelType } from "../channel/types";
import { ValveType } from "../valve/types";

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
    function: ChannelType;
    name: string;
  }>;
  valves?: Array<{ 
    valve_number: number; 
    function: ValveType;
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

export enum PoolAction {
  CycleChannelMode = 1,          // Cycles through a channel device's modes
  SetValveMode = 2,              // Sets a valve device's mode
  SetPoolSpaSelection = 3,       // Sets system to Pool or Spa mode (for combined systems)
  SetHeaterMode = 4,             // Sets a heater's mode
  SetHeaterSetTemperature = 5,   // Sets a heater's target temperature (pool or spa)
  SetLightingZoneMode = 6,       // Sets a lighting zone's mode
  SetLightingZoneColor = 7,      // Sets a lighting zone's color (color-enabled zones only)
  SetActiveFavourite = 8,        // Sets the current active favourite
  SetSolarMode = 9,              // Sets a solar heater's mode
  SetSolarSetTemperature = 10,   // Sets a solar heater's set temperature (pool or spa)
  SendLightingZoneColorSync = 11,// Resyncs lighting color for some zones
  SetHeatCoolSelection = 12      // Sets the current heat/cool mode
}

export enum FailureCode {
    GeneralError = 1,
    InvalidPoolSystem = 2,
    InvalidAPICode = 3,
    APINotEnabled = 4,
    InvalidAPIKey = 5,
    TimeThrottleExceeded = 6,
    PoolNotConnected = 7,
    InvalidActionCode = 8,
    InvalidValue = 9,
    InvalidChannelNumber = 10,
    InvalidValveNumber = 11,
    PoolSpaSelectionNotEnabled = 12,
    InvalidHeater = 13,
    InvalidHeaterSetTemp = 14,
    InvalidLightingZone = 15,
    LightingZoneNotColorEnabled = 16,
    InvalidLightingZoneColor = 17,
    InvalidFavouriteNumber = 18,
    InvalidSolarSystemNumber = 19,
    InvalidSolarSetTemp = 20,
    LightingZoneDoesNotSupportSync = 21,
    HeatCoolSelectionNotSupported = 22,
}

export enum ExecutionStatus {
    WaitingForExecution = 0,
    ExecutedSuccessfully = 1,
    ExecutionFailed = 2,
}
