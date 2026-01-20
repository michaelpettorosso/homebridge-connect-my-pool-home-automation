
import { PoolAction } from '../types/api'

export type HeaterBody = 'pool' | 'spa';
export enum HeaterMode {
  Off = 0,
  Auto = 1,
  On = 2,
}

export interface HeaterAccessoryContext {
  body: HeaterBody;
  targetTemp: Record<HeaterBody, number>;
}


export enum SolarMode {
  Off = 0,
  Auto = 1,
  On = 2,
}

export interface SolarRuntimeState {
  mode: SolarMode;
  active: boolean;      // calculated from sun position
  available: boolean;  // solar system exists
  lat: number;
  lon: number;
}

export interface SolarModeBody {
  pool_api_code: string;
  action_code: PoolAction.SetSolarMode;
  device_number: number;
  value: number;
}

export interface HeaterRuntimeState {
  enabled: boolean;
  currentTemp: Record<HeaterBody, number>;
  solar?: SolarRuntimeState;
}

export interface HeaterTempBody {
  pool_api_code: string;
  action_code: PoolAction.SetHeaterSetTemperature;
  device_number: number;
  value: number;
}

export interface HeaterModeBody {
  pool_api_code: string;
  action_code: PoolAction.SetHeaterMode;
  device_number: number;
  value: number;
}

export enum TemperatureScale {
  Celsius = 0,
  Fahrenheit = 1,
}

export enum PoolSpaSelection {
  Spa = 0,
  Pool = 1,
}

export enum HeatCoolSelection {
  Cooling = 0,
  Heating = 1,
}

export enum HeaterStatus {
  Off = 0,
  On = 1,
}

