import { Categories } from 'homebridge';
import { LightingZoneConfig } from '../config';
import { IDevice } from './iDevice';

export class LightingDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data;
  static readonly type = 'Lighting';
  constructor(config: LightingZoneConfig, name: string) {
    this.deviceType = LightingDevice.type;
    this.deviceName = name + ' Light';
    this.deviceTypeNumber = config.lighting_zone_number;
    this.data = config;
    this.category = Categories.LIGHTBULB;
  }

}