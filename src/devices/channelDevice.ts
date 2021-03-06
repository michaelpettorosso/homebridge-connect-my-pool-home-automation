import { Categories } from 'homebridge';
import { ChannelConfig } from '../config';
import { ConfigTypes, IDevice } from './iDevice';

export class ChannelDevice implements IDevice {
  readonly deviceName: string;
  readonly deviceType: string;
  readonly deviceTypeNumber: number;
  readonly category: Categories | undefined;
  readonly data: ConfigTypes;
  readonly function: number;
  static readonly type = 'Channel';

  constructor(config: ChannelConfig, name: string, _function: number) {
    this.deviceType = ChannelDevice.type;
    this.deviceName = name;
    this.deviceTypeNumber = config.channel_number;
    this.data = config;
    this.category = Categories.SWITCH;
    this.function = _function;
  }
}