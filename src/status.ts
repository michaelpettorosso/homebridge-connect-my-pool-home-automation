import { IConfigStatus } from './configStatus';
import {
  ChannelsMode,
  HeatersMode,
  LightingMode,
  MIN_TARGET_TEMP,
  MIN_TEMP,
  PoolSpaSelection,
  SolarSystemMode,
  ValveMode} from './settings';

export interface KeyValuePair {
    key: number;
    value: string;
}

export interface IHeaterStatus {
        heater_number: number;
        mode: number;
        set_temperature: number;
        spa_set_temperature: number;
    }

export interface ISolarSystemStatus {
        solar_number: number;
        mode: number;
        set_temperature: number;
    }

export interface IChannelStatus {
        channel_number: number;
        mode: number;
    }

export interface IValveStatus {
        valve_number: number;
        mode: number;
    }

export interface ILightingZoneStatus {
        lighting_zone_number: number;
        mode: number;
        color: number;
    }

export interface PoolStatus {
        pool_spa_selection: number;
        heat_cool_selection: number;
        temperature: number;
        active_favourite: number;
        heaters: IHeaterStatus[];
        solar_systems: ISolarSystemStatus[];
        channels: IChannelStatus[];
        valves: IValveStatus[];
        lighting_zones: ILightingZoneStatus[];
    }

export class SolarSystemStatus implements ISolarSystemStatus, IConfigStatus {
  public readonly configStatusName = 'SolarSystemConfigStatus';
  public readonly hasStatus: boolean;
  public readonly mode: number;

  public readonly solar_number: number;
  public readonly temperature: number;
  public readonly set_temperature: number;
  constructor(solar_number: number, hasStatus = false) {
    this.hasStatus = hasStatus;
    this.solar_number = solar_number;
    this.mode = SolarSystemMode.OFF;
    this.temperature = MIN_TEMP;
    this.set_temperature = MIN_TARGET_TEMP;
  }
}

export class HeaterStatus implements IHeaterStatus, IConfigStatus {
  public readonly configStatusName = 'HeaterConfigStatus';
  public readonly hasStatus: boolean;
  public readonly mode: number;

  public readonly heater_number: number;
  public readonly temperature: number;
  public readonly set_temperature: number;
  public readonly spa_set_temperature: number;
  public readonly pool_spa_selection: number;
  public readonly pool_spa_selection_enabled: boolean;
  constructor(heater_number: number, hasStatus = false, pool_spa_selection_enabled = false) {
    this.hasStatus = hasStatus;
    this.heater_number = heater_number;
    this.mode = HeatersMode.OFF;
    this.temperature = MIN_TEMP;
    this.set_temperature = MIN_TARGET_TEMP;
    this.spa_set_temperature = MIN_TARGET_TEMP;
    this.pool_spa_selection = PoolSpaSelection.POOL;
    this.pool_spa_selection_enabled = pool_spa_selection_enabled;
  }
}

export class LightingZoneStatus implements ILightingZoneStatus, IConfigStatus {
  public readonly configStatusName = 'LightingZoneConfigStatus';
  public readonly hasStatus: boolean;
  public readonly mode: number;

  public readonly lighting_zone_number: number;
  public readonly color: number;
  constructor(lighting_zone_number: number, hasStatus = false) {
    this.hasStatus = hasStatus;
    this.lighting_zone_number = lighting_zone_number;
    this.mode = LightingMode.OFF;
    this.color = 0;
  }
}

export class ChannelStatus implements IChannelStatus, IConfigStatus {
  public readonly configStatusName = 'ChannelConfigStatus';
  public readonly hasStatus: boolean;
  public readonly mode: number;

  public readonly channel_number: number;
  public readonly function: number;
  constructor(channel_number: number, hasStatus = false, _function: number) {
    this.hasStatus = hasStatus;
    this.channel_number = channel_number;
    this.mode = ChannelsMode.OFF;
    this.function = _function;
  }
}

export class ValveStatus implements IValveStatus, IConfigStatus {
  public readonly configStatusName = 'ValveConfigStatus';
  public readonly hasStatus: boolean;
  public readonly mode: number;

  public readonly valve_number: number;
  constructor(valve_number: number, hasStatus = false) {
    this.hasStatus = hasStatus;
    this.valve_number = valve_number;
    this.mode = ValveMode.OFF;
  }
}