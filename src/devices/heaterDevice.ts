import { Categories } from 'homebridge';
import { HeaterConfig } from '../config';
import { IDevice, ConfigTypes } from './iDevice';

export class HeaterDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data: ConfigTypes;
  readonly hasPoolSpaSelectionEnabled: boolean;

  static readonly type = 'Heater';
  constructor(config: HeaterConfig, count: number, hasPoolSpaSelectionEnabled = false) {
    this.deviceType = HeaterDevice.type;
    this.deviceName = 'Pool Heater';
    if (count > 1) {
      this.deviceName += ' ' + count.toString();
    }
    this.hasPoolSpaSelectionEnabled = hasPoolSpaSelectionEnabled;
    this.deviceTypeNumber = config.heater_number;
    this.data = config;
    this.category = Categories.THERMOSTAT;
  }
}