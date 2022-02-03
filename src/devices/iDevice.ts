import { Categories } from 'homebridge';
import { ChannelConfig, FavouriteConfig, HeaterConfig, LightingZoneConfig, SolarSystemConfig } from '../config';

export declare type ConfigTypes = ChannelConfig | FavouriteConfig | HeaterConfig | LightingZoneConfig | SolarSystemConfig;
export interface IDevice {
    readonly deviceName: string;
    readonly deviceType: string;
    readonly deviceTypeNumber: number;
    readonly category: Categories | undefined;
    readonly data: ConfigTypes;
}