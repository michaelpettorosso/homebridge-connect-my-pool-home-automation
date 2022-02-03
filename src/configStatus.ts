import { ChannelConfig, FavouriteConfig, HeaterConfig, LightingZoneConfig, SolarSystemConfig, ValveConfig } from './config';
import { IChannelStatus, IHeaterStatus, ILightingZoneStatus, ISolarSystemStatus, IValveStatus } from './status';

export interface IConfigStatus {
    configStatusName : string;
    hasStatus: boolean;
}

export interface IHeaterConfigStatus extends IConfigStatus, HeaterConfig, IHeaterStatus {
    temperature: number;
    pool_spa_selection: number;
    pool_spa_selection_enabled: boolean;
}

export interface ISolarSystemConfigStatus extends IConfigStatus, SolarSystemConfig, ISolarSystemStatus {
    temperature: number;
}

export interface IFavouriteConfigStatus extends IConfigStatus, FavouriteConfig {
    active_favourite: number;
}

export interface ILightingZoneConfigStatus extends IConfigStatus, LightingZoneConfig, ILightingZoneStatus {

}

export interface IChannelConfigStatus extends IConfigStatus, ChannelConfig, IChannelStatus {
    function: number;
}

export interface IValveConfigStatus extends IConfigStatus, ValveConfig, IValveStatus {

}

