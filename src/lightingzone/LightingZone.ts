import { API, Logger, PlatformAccessory, Service } from 'homebridge';
import { LightAccessoryConfig } from '../types/accessory';
import { ModeCharacteristic } from '../ModeCharacteristic';

import {
  LightingZoneState,
  LightingZoneMode,
  LightingZoneRuntimeState,
} from './types';

export class LightingZone {
  private service: Service;
  private runtime: LightingZoneRuntimeState;

  constructor(
    private readonly log: Logger,
    private readonly api: API,
    private readonly accessory: PlatformAccessory,
    private readonly config: LightAccessoryConfig,
    private readonly getLightState: (id: string) => LightingZoneState | undefined,
    private readonly setLightState: (id: string, state: LightingZoneState) => Promise<void>,
  ) {
    this.service = this.createService();

    this.runtime = {
      mode: 'off',
      colour: undefined
    }
  }

  private createService(): Service {
    const { Service, Characteristic } = this.api.hap;

    const service =
      this.accessory.getService(this.config.name) ??
      this.accessory.addService(Service.Switch, this.config.name);

    const modeChar = (Characteristic as any).Mode;

    service.getCharacteristic(modeChar)
      .onGet(() => this.getZoneState())
      .onSet(async (value) => {
        const mode = ModeCharacteristic.fromValue(value as number) as LightingZoneMode;
        await this.setZoneState(mode);
      });

    return service;
  }

  /**
   * Determine the zone state:
   * - If all lights are OFF → return OFF
   * - If all lights are ON → return ON
   * - Otherwise → return AUTO
   */
  private getZoneState(): number {
    const mode = this.getLightState(this.config.id)?.mode ?? 'off';

    if (mode === 'off') return ModeCharacteristic.toValue('off');
    if (mode === 'on') return ModeCharacteristic.toValue('on');

    return ModeCharacteristic.toValue('auto');
  }

  private async setZoneState(mode: LightingZoneMode) {
    this.log.info(`Lighting Zone "${this.config.name}" → ${mode.toUpperCase()}`);

    await this.setLightState(this.config.id, { mode });
  }
}