import { Categories } from 'homebridge';
import { HeaterConfig } from '../config';
import { IDevice } from './iDevice';

export class HeaterDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data;
  static readonly type = 'Heater';
  constructor(config: HeaterConfig, count: number) {
    this.deviceType = HeaterDevice.type;
    this.deviceName = 'Pool Heater';
    if (count > 1) {
      this.deviceName += ' ' + count.toString();
    }
    this.deviceTypeNumber = config.heater_number;
    this.data = config;
    this.category = Categories.THERMOSTAT;
  }

}