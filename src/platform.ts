import { API, DynamicPlatformPlugin, PlatformAccessory, PlatformConfig, Service, Characteristic, Logging } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME, BASE_URL, API_INTERVAL, TemperatureScale } from './settings';
import axios from 'axios';

import { IDevice } from './devices/iDevice';
import { SolarSystemDevice } from './devices/solarSystemDevice';
import { SolarSystemAccessory } from './accesories/solarSystemAccessory';
import { ChannelDevice } from './devices/channelDevice';
import { ChannelAccessory } from './accesories/channelAccessory';
import { HeaterDevice } from './devices/heaterDevice';
import { HeaterAccessory } from './accesories/heaterAccessory';
import { FavouriteDevice } from './devices/favouriteDevice';
// import { FavouriteAccessory } from './accesories/favouriteAccessory';
import { LightingZoneDevice } from './devices/lightingZoneDevice';
import { LightingAccessory } from './accesories/lightingAccessory';
import { Accessory } from './accesories/accessory';
import { PoolStatus } from './status';
import { PoolConfig } from './config';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class ConnectMyPoolHomeAutomationHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: Accessory[] = [];
  private pollIntervalId;
  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {

    this.log.debug('Finished initializing platform:', this.config.name);
    axios.defaults.baseURL = BASE_URL;
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  async configureAccessory(homekitAccessory: PlatformAccessory) {
    this.log.info(`Restoring cached accessory ${homekitAccessory.displayName}`);

    try {
      const device = homekitAccessory.context.device as IDevice;
      const poolStatus = homekitAccessory.context.status as PoolStatus;
      let accessory : Accessory | undefined;
      if (device) {
        this.log.debug('Device', device);
        if (device.deviceType === HeaterDevice.type) {
          const heaterDevice = device as HeaterDevice;
          accessory = new HeaterAccessory(this, homekitAccessory, heaterDevice, poolStatus);
        } else if (device.deviceType === SolarSystemDevice.type) {
          accessory = new SolarSystemAccessory(this, homekitAccessory, device, poolStatus);
        } else if (device.deviceType === ChannelDevice.type) {
          const channelDevice = device as ChannelDevice;
          accessory = new ChannelAccessory(this, homekitAccessory, channelDevice, poolStatus);
        } else if (device.deviceType === LightingZoneDevice.type) {
          accessory =new LightingAccessory(this, homekitAccessory, device, poolStatus);
        } //else if (device.deviceType === FavouriteDevice.type) {
        //   accessory =new FavouriteAccessory(this, homekitAccessory, device, poolStatus);
        // }
        if (accessory) {
          this.accessories.push(accessory);
        }
      }
    } catch (error) {
      this.log.error(
        `Failed to restore cached accessory ${homekitAccessory.displayName}`,
        error,
      );
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const devices:IDevice[] = [];
    const poolConfig = await this.getPoolConfig();
    if (poolConfig) {
      if (poolConfig.has_heaters === true) {
        let i = 0;
        for (const heater of poolConfig.heaters) {
          i++;
          const device: IDevice = new HeaterDevice(heater, i, poolConfig.pool_spa_selection_enabled);
          devices.push(device);
        }
      }
      if (poolConfig.has_solar_systems === true) {
        let i = 0;
        for (const solarsystem of poolConfig.solar_systems) {
          i++;
          const device:IDevice = new SolarSystemDevice(solarsystem, i);
          devices.push(device);
        }
      }
      if (poolConfig.has_channels === true) {
        for (const channel of poolConfig.channels) {
          const device:IDevice = new ChannelDevice(channel, channel.name, channel.function);
          devices.push(device);
        }
      }
      if (poolConfig.has_lighting_zones === true) {
        for (const lighting of poolConfig.lighting_zones) {
          const device:IDevice = new LightingZoneDevice(lighting, lighting.name);
          devices.push(device);
        }
      }
      if (poolConfig.has_favourites === true) {
        for (const favourite of poolConfig.favourites) {
          const device:IDevice = new FavouriteDevice(favourite, favourite.name);
          devices.push(device);
        }
      }
      const poolStatus = await this.getPoolStatus();

      for (const device of devices) {
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        this.log.debug('Accessories:', this.accessories.length);

        const existingAccessory = this.accessories.find(accessory => accessory.device.deviceType === device.deviceType
          && accessory.deviceName === device.deviceName);
        if (!existingAccessory && poolStatus) {
          // create a new accessory
          const uuid = this.api.hap.uuid.generate(`${device.deviceType}:${device.deviceTypeNumber}`);

          const platformAccessory = new this.api.platformAccessory(device.deviceName, uuid, device.category);
          let accessory : Accessory | undefined;
          if (device.deviceType === HeaterDevice.type) {
            accessory = new HeaterAccessory(this, platformAccessory, device as HeaterDevice, poolStatus);
          } else if (device.deviceType === SolarSystemDevice.type) {
            accessory = new SolarSystemAccessory(this, platformAccessory, device, poolStatus);
          } else if (device.deviceType === ChannelDevice.type) {
            accessory = new ChannelAccessory(this, platformAccessory, device as ChannelDevice, poolStatus);
          } else if (device.deviceType === LightingZoneDevice.type) {
            accessory =new LightingAccessory(this, platformAccessory, device, poolStatus);
          } //else if (device.deviceType === FavouriteDevice.type) {
          //   accessory =new FavouriteAccessory(this, platformAccessory, device, poolStatus);
          // }
          if (accessory) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', device.deviceName);
            this.accessories.push(accessory);

            // link the accessory to your platform
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
          } else{
            this.log.debug('Unable to add new accessory:', device.deviceName);
          }
        } else{
          this.log.debug('Restoring accessory:', device.deviceName);
        }
      }
    }
    this.poll(API_INTERVAL);
  }

  poll(interval: number) {
    this.log.info('Poll PoolStatus');
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }

    this.pollIntervalId = setInterval(async () => {
      const poolStatus = await this.getPoolStatus();
      if (poolStatus) {
        this.log.debug('PoolStatus', poolStatus);
        for (const accessory of this.accessories) {
          await accessory.updateStatus(poolStatus);
        }
      }
    }, interval);
  }

  public async setPoolAction(actionCode: number,
    deviceNumber: number,
    value: string,
    outputResponse = false,
    waitForExecution = true): Promise<boolean | undefined> {

    const payload = {
      'pool_api_code': this.config.apikey,
      'temperature_scale': TemperatureScale.CELSIUS,
      'action_code': actionCode,
      'device_number': deviceNumber,
      'value': value,
      'wait_for_execution': waitForExecution,
    };
    this.log.debug('Set PoolAction', payload);
    const req = axios.post('poolaction', payload);
    const res = await req;
    const status = res.data;
    if (outputResponse) {
      this.log.debug('Set PoolAction Response', status);
    }
    if (status.failure_code) {
      this.log.error('Set PoolAction Failed', status);
      return undefined;

    }
    return status.execution_status === 1;
  }

  private async getPoolStatus() : Promise<PoolStatus | undefined> {
    this.log.debug('getPoolStatus');
    const req = axios.post('poolstatus', {
      'pool_api_code': this.config.apikey,
      'temperature_scale': TemperatureScale.CELSIUS,
    } );
    const res = await req;
    const status = res.data;

    if (status.failure_code) {
      this.log.error('PoolStatus Failed', status);
      return undefined;

    }
    return status;
  }

  private async getPoolConfig() : Promise<PoolConfig | undefined> {
    this.log.debug('getPoolConfig');
    const req = axios.post('poolconfig', {
      'pool_api_code': this.config.apikey,
    } );
    const res = await req;
    return res.data;
  }
}