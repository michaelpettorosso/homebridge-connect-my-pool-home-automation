export interface HeaterStatus {
        heater_number: number;
        mode: number;
        set_temperature: number;
        spa_set_temperature: number;
    }

export interface SolarSystemStatus {
        solar_number: number;
        mode: number;
        set_temperature: number;
    }

export interface ChannelStatus {
        channel_number: number;
        mode: number;
    }

export interface LightingZoneStatus {
        lighting_zone_number: number;
        mode: number;
        color: number;
    }

export interface PoolStatus {
        pool_spa_selection: number;
        heat_cool_selection: number;
        temperature: number;
        active_favourite: number;
        heaters: HeaterStatus[];
        solar_systems: SolarSystemStatus[];
        channels: ChannelStatus[];
        valves: [];
        lighting_zones: LightingZoneStatus[];
    }

