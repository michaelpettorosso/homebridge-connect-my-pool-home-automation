import { API, Logger, PlatformAccessory } from 'homebridge';
import { RateLimiter } from './RateLimiter';
import { ModeCharacteristic } from './ModeCharacteristic';
import {
  PLATFORM_NAME,
  PLUGIN_NAME,
} from './settings';

import { 
  AccessoryConfig,
  AccessoryStatus,
  HeaterAccessoryConfig,
  LightAccessoryConfig,
  LightZoneAccessoryStatus,
} from './types/accessory';

import { 
  PoolAction,
} from './types/api';


import { Heater } from './heater/Heater';
import { 
  HeaterBody, 
  HeaterMode, 
  HeaterModeBody, 
  HeaterTempBody,
  PoolSpaSelection,
  SolarMode,
  SolarModeBody
} from './heater/types';
import { WeatherService } from './services/WeatherService';
import { LightingZone } from './lightingzone/LightingZone';
import { LightingZoneState, LightingZoneModeBody } from './lightingzone/types';
import { stat } from 'fs';


export class AccessoryStore {
  private accessories = new Map<string, PlatformAccessory>();
  private states = new Map<string, AccessoryStatus | undefined>();

  constructor(
    private readonly log: Logger,
    private readonly api: API,
    private readonly rateLimiter: RateLimiter,
    private readonly apiKey: string,
    private readonly baseUrl: string
  ) {}

  restore(accessory: PlatformAccessory) {
    this.accessories.set(accessory.context.id, accessory);
    this.states.set(accessory.context.id, accessory.context.mode ?? 'off');
  }

  add(config: AccessoryConfig, status?: AccessoryStatus): PlatformAccessory {
    const uuid = this.api.hap.uuid.generate(
      `connectmypool:${config.type}:${config.id}`
    );
    
    let accessory = this.accessories.get(config.id);
    if (!accessory) {
      accessory = new this.api.platformAccessory(config.name, uuid);

      accessory.context = config;

      this.accessories.set(config.id, accessory);
      this.states.set(config.id, status);

      this.api.registerPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [accessory]
      );
      this.setupServices(accessory, config);

      this.log.info(`Registered ${config.type} ${config.name}`);
    }

    return accessory;
  }

  remove(id: string) {
    const accessory = this.accessories.get(id);
    if (!accessory) return;

    if (typeof this.api.unregisterPlatformAccessories !== 'function') {
      this.log.warn('unregisterPlatformAccessories not available');
      return;
    }
    this.api.unregisterPlatformAccessories(
      PLUGIN_NAME,
      PLATFORM_NAME,
      [accessory]
    );

    this.accessories.delete(id);
    this.states.delete(id);
  }

  getAllIds(): string[] {
    return [...this.accessories.keys()];
  }

  getAccessory(id: string) {
    return this.accessories.get(id);
  }

  setState(id: string, status: AccessoryStatus) {
    this.states.set(id, status);
  }

  getState(id: string): AccessoryStatus | undefined {
    return this.states.get(id);
  }

  private setupServices(accessory: PlatformAccessory, config: AccessoryConfig) {
    const { Service } = this.api.hap;

    const modeChar = (this.api.hap.Characteristic as any).Mode;

    // if (config.type === 'channel' || config.type === 'valve') {
    //   const service =
    //     accessory.getService(Service.Switch) ??
    //     accessory.addService(Service.Switch, config.name);
  
    //   service.getCharacteristic(modeChar)
    //   .onGet(() => ModeCharacteristic.toValue(this.getState(config.id) ?? 'off'))
    //   .onSet(async (value) => {
    //     const mode = ModeCharacteristic.fromValue(value as number);
    //     const status = { ...this.getState(config.id), mode};
    //     this.setState(config.id, status);
    //     await this.setRemoteState(config, status);
    //   });
    // }

    if (config.type === 'light') {
      const lightConfig = (config as LightAccessoryConfig);
      const light = new LightingZone(
        this.log,
        this.api,
        accessory,
        lightConfig,
        (id) => {
          return this.getRemoteLightingZoneState(id);
        },
        async (id, state) => {
          await this.setRemoteLightingZoneMode(id, state);
        }
      )

    }

    if (config.type === 'heater') {
      const heaterConfig = (config as HeaterAccessoryConfig);
      let weather: WeatherService | undefined;
      if (heaterConfig.solarId > 0 && heaterConfig.solarConfig)
        weather = new WeatherService(heaterConfig.solarConfig?.weatherApiKey);
      const heater = new Heater(
        this.log,
        this.api,
        accessory,
        heaterConfig, 
        async (body, mode) => {
          await this.setRemoteHeaterMode(body, mode);
        },
        async (body, temp) => {
          await this.setRemoteTargetTemp(body, temp);
        },
        async (id, mode) => {
          await this.setRemoteSolarMode(id, mode);
        },
        weather
      );
    }
    return;
  }

  getRemoteLightingZoneState(
        id: string
        ) : LightingZoneState {

    const status = this.states.get(id) as LightZoneAccessoryStatus;      
    return {
      mode: ModeCharacteristic.fromValue(status.mode),
      colour: status.colour,
    }
  }

  private async setRemoteLightingZoneMode(
        id: string,
        state: LightingZoneState,
        ) {

      const [type, numberStr] = id.split('-');
      const deviceNumber = parseInt(numberStr, 10);    
      const value = ModeCharacteristic.toValue(state.mode);
        const payload: LightingZoneModeBody = {
          pool_api_code: this.apiKey,
          action_code:	PoolAction.SetLightingZoneMode,
          device_number: deviceNumber,
          value: value,
        };

        this.log.info(`Sending lighting zone mode → ${id}: ${state.mode}`);
        this.log.debug('Payload:', payload);

        const res = await fetch(`${this.baseUrl}/poolaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Failed to set lighting zone mode: ${res.status}`);
        }

        this.log.info(`Lighting Zone ${id} mode set to ${state.mode}`);
      }


  private async setRemoteSolarMode(
    id: number,
    mode: SolarMode,
    ) {
    await this.rateLimiter.schedule(async () => {  
      const payload: SolarModeBody = {
        pool_api_code: this.apiKey,
        action_code:	PoolAction.SetSolarMode,
        device_number: id,
        value: mode,
      };

      this.log.info(`Sending solar mode → ${id}: ${mode}`);
      this.log.debug('Payload:', payload);

      const res = await fetch(`${this.baseUrl}/poolaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to set solar mode: ${res.status}`);
      }

      this.log.info(`Solar ${id} mode set to ${mode}`);
    });
  }


  private async setRemoteHeaterMode(
    body: HeaterBody,
    mode: HeaterMode,
    ) {
          await this.rateLimiter.schedule(async () => {  

    // Map body → heater_number
    const deviceNumber = body === 'pool' ? PoolSpaSelection.Pool : PoolSpaSelection.Spa; // adjust if API numbering differs

    const payload: HeaterModeBody = {
      pool_api_code: this.apiKey,
      action_code:	PoolAction.SetHeaterMode,
      device_number: deviceNumber,
      value: mode,
    };

    this.log.info(`Sending heater mode → ${body}: ${mode}`);
    this.log.debug('Payload:', payload);

    const res = await fetch(`${this.baseUrl}/poolaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to set heater mode: ${res.status}`);
    }

    this.log.info(`Heater ${body} target mode set to ${mode}`);
  });
  }

  private async setRemoteTargetTemp(
    body: HeaterBody,
    temp: number
  ) {

        await this.rateLimiter.schedule(async () => {  

    // Map body → heater_number
    const deviceNumber = body === 'pool' ?  PoolSpaSelection.Pool : PoolSpaSelection.Spa; // adjust if API numbering differs

    const payload: HeaterTempBody = {
      pool_api_code: this.apiKey,
      action_code:	PoolAction.SetHeaterSetTemperature,
      device_number: deviceNumber,
      value: temp,
    };

    this.log.info(`Sending target temperature → ${body}: ${temp}°`);
    this.log.debug('Payload:', payload);

    const res = await fetch(`${this.baseUrl}/poolaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to set heater target temp: ${res.status}`);
    }

    this.log.info(`Heater ${body} target temperature set to ${temp}°`);
  });
  }


}
