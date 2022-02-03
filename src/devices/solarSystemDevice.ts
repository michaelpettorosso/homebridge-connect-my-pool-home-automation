import { Categories } from 'homebridge';
import { SolarSystemConfig } from '../config';
import { IDevice, ConfigTypes } from './iDevice';

export class SolarSystemDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data: ConfigTypes;
  static readonly type = 'SolarHeater';
  constructor(config: SolarSystemConfig, count: number) {
    this.deviceType = SolarSystemDevice.type;
    this.deviceName = 'Solar Heater';
    if (count > 1) {
      this.deviceName += ' ' + count.toString();
    }
    this.deviceTypeNumber = config.solar_number;
    this.data = config;
    this.category = Categories.THERMOSTAT;
  }
}