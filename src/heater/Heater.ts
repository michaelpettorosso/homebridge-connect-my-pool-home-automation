import { API, Logger, PlatformAccessory, Service } from 'homebridge';
import { HeaterAccessoryConfig } from '../types/accessory';

import {
  HeaterMode,
  SolarMode,
  HeaterBody,
  HeaterRuntimeState,
  HeaterAccessoryContext,
  SolarRuntimeState
} from './types';

import { PoolStatusResponse } from '../types/api';
import { WeatherService } from '../services/WeatherService';

export class Heater {
  private servicePool: Service;
  private serviceSpa?: Service;
  private serviceSolar?: Service;
  private runtime: HeaterRuntimeState;

  constructor(
    private readonly log: Logger,
    private readonly api: API,
    private readonly accessory: PlatformAccessory,
    private readonly config: HeaterAccessoryConfig,
    private readonly sendMode: (body: HeaterBody, mode: HeaterMode) => Promise<void>,
    private readonly sendTargetTemp: (body: HeaterBody, temp: number) => Promise<void>,
    private readonly sendSolarMode: (id: number, mode: SolarMode) => Promise<void>,
    private readonly weather?: WeatherService,
  ) {
    this.initContext();

    this.servicePool = this.createThermostat('pool', 'Pool Heater');

    if (this.config.poolSpaSelectionEnabled) {
      this.serviceSpa = this.createThermostat('spa', 'Spa Heater');
    }

    if (this.isSolarAvailable()) {
      this.serviceSolar = this.createSolarModeService();
    }

    this.runtime =  {
      enabled: false,
      currentTemp: {
        pool: 0,
        spa: 0,
      }
    }
  }

  // -------------------- Context --------------------
  private initContext() {
    const ctx = this.accessory.context as Partial<HeaterAccessoryContext>;

    this.accessory.context = {
      body: ctx.body ?? 'pool',
      targetTemp: {
        pool: ctx.targetTemp?.pool ?? 28,
        spa: ctx.targetTemp?.spa ?? 38,
      },
    } as HeaterAccessoryContext;
  }

  private get ctx(): HeaterAccessoryContext {
    return this.accessory.context as HeaterAccessoryContext;
  }

  // -------------------- Seasonal Solar Limits --------------------
  private getLat(): number {
    return this.config.solarConfig?.lat ?? -37.8136; // Melbourne default
  }

  private getLon(): number {
    return this.config.solarConfig?.lon ?? 144.9631;
  }

  private isSolarAvailable(): boolean {
    return this.config.solarId > 0;
  }


  private isSolarSeason(): boolean {
    const month = new Date().getMonth();
    const start = this.config.solarConfig?.startMonth ?? 2; // March
    const end = this.config.solarConfig?.endMonth ?? 10;    // November

    return start <= end
      ? month >= start && month <= end
      : month >= start || month <= end;
  }

  private getCloudLimit(): number {
    return this.config.solarConfig?.cloudLimit ?? 70;
  }
    // -------------------- Sun + Weather Logic --------------------
  private async isSolarEffective(lat: number, lon: number): Promise<boolean> 
  {
    if (!this.isSolarSeason()) return false;

    try {
      const data = await this.weather?.getSolarData(lat, lon);
      if (!data) throw new Error('No weather data');

      const now = Math.floor(Date.now() / 1000);

      const sunUp = now >= data.sunrise && now <= data.sunset;
      const tooCloudy = data.cloud > this.getCloudLimit();

      return sunUp && !tooCloudy;

    } catch (err) {
      // Fallback: simple hour-based logic
      const hour = new Date().getHours();
      return hour >= 9 && hour <= 17;
    }
  }


  // -------------------- Service Creation --------------------
  private createThermostat(body: HeaterBody, name: string): Service {
    const { Service, Characteristic } = this.api.hap;

    const service =
      this.accessory.getService(name) ??
      this.accessory.addService(Service.Thermostat, name, body);

    service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: [
          Characteristic.TargetHeatingCoolingState.OFF,
          Characteristic.TargetHeatingCoolingState.HEAT,
          Characteristic.TargetHeatingCoolingState.AUTO,
        ],
      })
      .onGet(() => this.getTargetMode(body))
      .onSet(value => this.setTargetMode(body, value as number));

    service
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .onGet(() => this.getCurrentState(body));

    service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(() => this.runtime.currentTemp[body]);

    service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minValue: body === 'spa' ? 30 : 20,
        maxValue: body === 'spa' ? 41 : 35,
        minStep: 0.5,
      })
      .onGet(() => this.ctx.targetTemp[body])
      .onSet(value => this.setTargetTemp(body, value as number));

    service
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .onGet(() => Characteristic.TemperatureDisplayUnits.CELSIUS);

    return service;
  }

  // -------------------- Heater Logic --------------------
  private getTargetMode(body: HeaterBody): number {
    const { Characteristic } = this.api.hap;

    if (!this.runtime.enabled || this.ctx.body !== body) {
      return Characteristic.TargetHeatingCoolingState.OFF;
    }

    return Characteristic.TargetHeatingCoolingState.HEAT;
  }

  private async setTargetMode(body: HeaterBody, value: number) {
    const { Characteristic } = this.api.hap;

    if (value === Characteristic.TargetHeatingCoolingState.OFF) {
      if (this.ctx.body === body) {
        this.runtime.enabled = false;
        await this.sendMode(body, HeaterMode.Off);
      }
      return;
    }

    this.ctx.body = body;
    this.runtime.enabled = true;

    const mode =
      value === Characteristic.TargetHeatingCoolingState.AUTO
        ? HeaterMode.Auto
        : HeaterMode.On;

    this.log.info(`Heater → ${body} (${HeaterMode[mode]})`);
    await this.sendMode(body, mode);
  }

  private getCurrentState(body: HeaterBody): number {
    const { Characteristic } = this.api.hap;

    if (!this.isHeatingAllowed(body)) {
      return Characteristic.CurrentHeatingCoolingState.OFF;
    }

    const current = this.runtime.currentTemp[body];
    const target = this.ctx.targetTemp[body];

    return current < target - 0.3
      ? Characteristic.CurrentHeatingCoolingState.HEAT
      : Characteristic.CurrentHeatingCoolingState.OFF;
  }

  private async setTargetTemp(body: HeaterBody, temp: number) {
    this.ctx.targetTemp[body] = temp;
    this.ctx.body = body;

    this.log.info(`Set ${body} target temperature → ${temp}°`);
    await this.sendTargetTemp(body, temp);
  }

  // -------------------- Pool Status Updates --------------------
  async updateFromPoolStatus(status: PoolStatusResponse) {
    const body: HeaterBody = status.pool_spa_selection === 0 ? 'spa' : 'pool';

    const heaterInfo = status.heaters?.[0];
    if (!heaterInfo) return;


    const runtimeState: HeaterRuntimeState = {
      enabled: heaterInfo.mode === 1,
      currentTemp: {
        pool: status.temperature,
        spa: status.temperature,
      }
    };

    const solarInfo = status.solar_systems?.[0];

    if (solarInfo) {
      const lat = this.getLat();
      const lon = this.getLon();


      const solarRuntimeState: SolarRuntimeState = {
        available: true,
        mode: solarInfo.mode,
        lat,
        lon,
        active: await this.isSolarEffective(lat, lon),
      };

      runtimeState.solar = solarRuntimeState;
    }

    const ctx = this.ctx;
    ctx.body = body;
    ctx.targetTemp.pool = heaterInfo.set_temperature ?? ctx.targetTemp.pool;
    ctx.targetTemp.spa = heaterInfo.spa_set_temperature ?? ctx.targetTemp.spa;

    this.updateRuntime(runtimeState);
  }

  // -------------------- Apply Updates --------------------
  updateRuntime(state: HeaterRuntimeState) {
    this.runtime = state;

    this.servicePool.updateCharacteristic(
      this.api.hap.Characteristic.CurrentTemperature,
      state.currentTemp.pool,
    );

    if (this.serviceSpa) {
      this.serviceSpa.updateCharacteristic(
        this.api.hap.Characteristic.CurrentTemperature,
        state.currentTemp.spa,
      );
    }
  }

  // -------------------- Solar Service --------------------
  private createSolarModeService(): Service {
    const { Service, Characteristic } = this.api.hap;

    const service =
      this.accessory.getService('Solar Mode') ??
      this.accessory.addService(Service.Thermostat, 'Solar Mode', 'solar');

    service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: [
          Characteristic.TargetHeatingCoolingState.OFF,
          Characteristic.TargetHeatingCoolingState.AUTO,
          Characteristic.TargetHeatingCoolingState.HEAT,
        ],
      })
      .onGet(() => this.getSolarMode())
      .onSet(value => this.setSolarMode(value as number));

    service
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .onGet(() => this.getSolarCurrentState());

    service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .onGet(() => this.runtime.currentTemp[this.ctx.body]);

    service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({ minValue: 0, maxValue: 0 })
      .onGet(() => 0);

    return service;
  }

  private getSolarMode(): number {
    const { Characteristic } = this.api.hap;

    switch (this.runtime.solar?.mode) {
      case SolarMode.On:
        return Characteristic.TargetHeatingCoolingState.HEAT;
      case SolarMode.Auto:
        return Characteristic.TargetHeatingCoolingState.AUTO;
      default:
        return Characteristic.TargetHeatingCoolingState.OFF;
    }
  }

  private getSolarCurrentState(): number {
    const { Characteristic } = this.api.hap;

    return this.runtime.solar?.active
      ? Characteristic.CurrentHeatingCoolingState.HEAT
      : Characteristic.CurrentHeatingCoolingState.OFF;
  }

  private async setSolarMode(value: number) {
    const { Characteristic } = this.api.hap;

    let mode: SolarMode;

    switch (value) {
      case Characteristic.TargetHeatingCoolingState.HEAT:
        mode = SolarMode.On;
        break;
      case Characteristic.TargetHeatingCoolingState.AUTO:
        mode = SolarMode.Auto;
        break;
      default:
        mode = SolarMode.Off;
    }

    this.log.info(`Solar Heater → ${SolarMode[mode]}`);
    await this.sendSolarMode(this.config.solarId, mode);

    if (mode === SolarMode.Auto) {
      this.runtime.enabled = true;
    }
  }

  private isHeatingAllowed(body: HeaterBody): boolean {
    const solar = this.runtime.solar;

    if (solar?.mode === SolarMode.On) return true;

    if (solar?.mode === SolarMode.Auto) {
      if (solar.active) return true;
      return this.runtime.enabled && this.ctx.body === body;
    }

    return this.runtime.enabled && this.ctx.body === body;
  }
 

}
