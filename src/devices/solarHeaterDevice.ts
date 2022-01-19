import { Categories } from 'homebridge';
import { SolarSystemConfig } from '../config';
import { IDevice } from './iDevice';

export class SolarHeaterDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data;
  static readonly type = 'SolarHeater';
  constructor(config: SolarSystemConfig, count: number) {
    this.deviceType = SolarHeaterDevice.type;
    this.deviceName = 'Solar Heater';
    if (count > 1) {
      this.deviceName += ' ' + count.toString();
    }
    this.deviceTypeNumber = config.solar_number;
    this.data = config;
    this.category = Categories.THERMOSTAT;
  }

}