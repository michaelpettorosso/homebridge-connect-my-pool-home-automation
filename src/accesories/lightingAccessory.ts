import { PlatformAccessory, Service } from 'homebridge';
import { PoolAction } from '../action';
import { LightingZoneConfig } from '../config';
import { ILightingZoneConfigStatus } from '../configStatus';
import { LightingZoneDevice } from '../devices/lightingZoneDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { LightingZoneStatus, PoolStatus } from '../status';
import { Accessory } from './accessory';
import { LightingMode } from '../settings';

/**
 * Channel Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightingAccessory extends Accessory {
  private stateOn: boolean | undefined;
  private lightingZoneConfigStatus : ILightingZoneConfigStatus;
  constructor(
    platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    accessory: PlatformAccessory,
    device: LightingZoneDevice,
    status: PoolStatus,
  ) {
    super(platform, accessory, device, status);
    this.lightingZoneConfigStatus = this.getLightingZoneConfigStatus(status);
  }

  protected setUpServices() {
    super.setUpServices();

    this.createLightingService();
    this.services[0].setPrimaryService(true);
    super.updatePlatform();
  }

  protected createLightingService(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Lightbulb, this.device.deviceType)
                        || this.accessory.addService(this.service.Lightbulb, this.device.deviceName, this.device.deviceType);

    zoneService.getCharacteristic(this.Characteristic.On)
      .onGet(this.getOnState.bind(this))
      .onSet(this.setOnState.bind(this));

    this.services.push(zoneService);
    return zoneService;
  }

  /// /////////////////////
  // GET AND SET CONFIG STATUS
  /// /////////////////////
  protected getLightingZoneConfigStatus(status : PoolStatus) : ILightingZoneConfigStatus {
    const currentstatus = status;
    const currentdevice = this.device as LightingZoneDevice;
    const currentConfig = currentdevice.data as LightingZoneConfig;
    if (currentstatus) {
      const lightStatus = currentstatus.lighting_zones.find(l => l.lighting_zone_number === currentConfig.lighting_zone_number);

      const lightConfigStatus : ILightingZoneConfigStatus =
      Object.assign({},
        new LightingZoneStatus(currentConfig.lighting_zone_number, true),
        currentConfig,
        lightStatus);
      this.log.debug('lightConfigStatus', lightConfigStatus);
      return lightConfigStatus;

    } else {
      const lightConfigStatus : ILightingZoneConfigStatus =
      Object.assign({},
        currentConfig,
        new LightingZoneStatus(currentConfig.lighting_zone_number));
      this.log.debug('lightConfigStatus', lightConfigStatus);
      return lightConfigStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.lightingZoneConfigStatus = this.getLightingZoneConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);

    this.services[0].getCharacteristic(this.Characteristic.On)
      .updateValue(this.getOnState());

    const lightingZoneConfigStatus = this.lightingZoneConfigStatus;
    if (lightingZoneConfigStatus.hasStatus) {
      if (lightingZoneConfigStatus.color_enabled === true && lightingZoneConfigStatus.color) {
        this.services[0].getCharacteristic(this.Characteristic.Hue).updateValue(lightingZoneConfigStatus.color);
      }
    }
  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////
  getOnState(): boolean {
    const lightingZoneConfigStatus = this.lightingZoneConfigStatus;
    const value = lightingZoneConfigStatus.mode === LightingMode.OFF ? false : true;
    this.log.debug('getOnState', value);
    this.stateOn = value;
    return this.stateOn;
  }

  setOnState(value) {
    this.log.debug('setOnState', value);
    if (this.stateOn === value) {
      return;
    }
    this.stateOn = value;
    this.platform.setPoolAction(PoolAction.SetLightingZoneMode, this.device.deviceTypeNumber,
      String(value === false ? LightingMode.OFF : LightingMode.ON)).then((res) => {
      this.log.debug('setOnState Result', res);
    });
  }
}