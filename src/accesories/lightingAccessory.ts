import { PlatformAccessory, Service } from 'homebridge';
import { LightingDevice } from '../devices/lightingDevice';

import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Channel Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightingAccessory extends Accessory {
  constructor(
    platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    accessory: PlatformAccessory,
    device: LightingDevice,
    status: PoolStatus | undefined,
  ) {
    super(platform, accessory, device, status);


  }

  protected setUpServices() {
    super.setUpServices();

    this.createLightingService();
    this.services[0].setPrimaryService(true);
    //this.createPoolTemperatureService();

    super.updatePlatform();

  }

  protected createLightingService(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Lightbulb, this.device.deviceType)
                        || this.accessory.addService(this.service.Lightbulb, this.device.deviceName, this.device.deviceType);

    this.services.push(zoneService);
    return zoneService;
  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////

  async updateStatus(status: PoolStatus | undefined) {
    await super.updateStatus(status);
    this.log.debug(`setStatus ${LightingDevice.type}`, status);
    //this.characteristic.CurrentHeatingCoolingState.HEAT;

    const currentstatus = this.status;
    const currentdevice = this.device;
    if (currentstatus) {

      const light = currentstatus.lighting_zones.find(l => l.lighting_zone_number === currentdevice.deviceTypeNumber);
      if (light) {

        const state = light.mode === 0 ? 0 : 1;

        this.services[0].getCharacteristic(this.characteristic.On)
          .updateValue(state);






      }

    }
  }

}
