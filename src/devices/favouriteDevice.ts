import { Categories } from 'homebridge';
import { FavouriteConfig } from '../config';
import { IDevice, ConfigTypes } from './iDevice';

export class FavouriteDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data: ConfigTypes;
  static readonly type = 'Favourite';
  constructor(config: FavouriteConfig, name: string) {
    this.deviceType = FavouriteDevice.type;
    this.deviceName = 'Favourite ' + name;
    this.deviceTypeNumber = config.favourite_number;
    this.data = config;
    this.category = Categories.SENSOR;
  }
}