import { API, Logger, PlatformAccessory } from 'homebridge';
import { RemoteAccessoryConfig, Mode } from './types';
import { RateLimiter } from './RateLimiter';
import { ModeCharacteristic } from './ModeCharacteristic';
import {
  PLATFORM_NAME,
  PLUGIN_NAME,
} from './settings';

export class AccessoryStore {
  private accessories = new Map<string, PlatformAccessory>();
  private states = new Map<string, Mode>();

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

  add(config: RemoteAccessoryConfig): PlatformAccessory {
    const uuid = this.api.hap.uuid.generate(
      `connectmypool:${config.type}:${config.id}`
    );

    let accessory = this.accessories.get(config.id);

    if (!accessory) {
      accessory = new this.api.platformAccessory(config.name, uuid);

      accessory.context = {
        id: config.id,
        type: config.type,
        mode: config.mode,
      };

      this.accessories.set(config.id, accessory);
      this.states.set(config.id, config.mode);

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

  setState(id: string, mode: Mode) {
    this.states.set(id, mode);
  }

  getState(id: string) {
    return this.states.get(id);
  }

  async setRemoteState(config: RemoteAccessoryConfig) {
    await this.rateLimiter.schedule(async () => {
      const [type, numberStr] = config.id.split('-');
      const deviceNumber = parseInt(numberStr, 10);

      let deviceType: string;
      switch (type) {
        case 'channel':
          deviceType = 'channel';
          break;
        case 'light':
          deviceType = 'lighting';
          break;
        case 'heater':
          deviceType = 'heater';
          break;
        case 'solar_system':
          deviceType = 'solar_system';
          break;  
        case 'valve':
          deviceType = 'valve';
          break;
        case 'favourite':
          deviceType = 'favourite';
          break;
        default:
          throw new Error(`Unknown device type: ${type}`);
      }

      const body = {
        pool_api_code: this.apiKey,
        device_type: deviceType,
        device_number: deviceNumber,
        mode: config.mode === 'on' ? 1 : 0,
      };

      this.log.debug('poolaction', body);

      const res = await fetch(`${this.baseUrl}/poolaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`poolaction failed: ${res.status}`);
      }
    });
  }

  private setupServices(accessory: PlatformAccessory, config: RemoteAccessoryConfig) {
    const { Service, Characteristic } = this.api.hap;

    if (config.type === 'channel' || config.type === 'valve') {
      const service =
        accessory.getService(Service.Switch) ??
        accessory.addService(Service.Switch);

      const { Characteristic } = this.api.hap;

      const ModeChar = (Characteristic as any).Mode;

      service.getCharacteristic(Characteristic.On)
        .onSet(async value => {
          const mode = value ? 'on' : 'off';
          this.setState(config.id, mode);
          await this.setRemoteState({ ...config, mode });
        });

      service.addCharacteristic(ModeChar)
        .onSet(async value => {
          const mode =
            value === 0 ? 'off' :
            value === 1 ? 'on' : 'auto';

          this.setState(config.id, mode);
          await this.setRemoteState({ ...config, mode });
        });

    }

    if (config.type === 'light') {
      const service =
        accessory.getService(Service.Lightbulb) ??
        accessory.addService(Service.Lightbulb);

      service.getCharacteristic(Characteristic.On)
        .onSet(async value => {
          const mode = value ? 'on' : 'off';
          this.setState(config.id, mode);
          await this.setRemoteState({ ...config, mode });
        });
    }

    if (config.type === 'heater') {
  const service = accessory.getService(Service.Thermostat)!;

  service
    .getCharacteristic(Characteristic.TargetHeatingCoolingState)
    .setProps({
      validValues: [
        Characteristic.TargetHeatingCoolingState.OFF,
        Characteristic.TargetHeatingCoolingState.HEAT,
        Characteristic.TargetHeatingCoolingState.AUTO
      ]
    })
    .onGet(() => {
      return this.states.get(accessory.context.remoteId) ?? 0;
    })
    .onSet(async value => {
        const mode = value ? 'on' : 'off';
        this.setState(config.id, mode);
        await this.setRemoteState({ ...config, mode });
    }
    );

    service
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .onGet(() => {
        return this.states.get(accessory.context.remoteId) ?? 0;
      });

  return;
}

  }

}
