/* eslint-disable @typescript-eslint/no-empty-function */
import { Logging, PlatformAccessory, Service } from 'homebridge';
import { Characteristic } from 'hap-nodejs';
import { IDevice } from '../devices/iDevice';

import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { MANUFACTURER } from '../settings';
import { PoolStatus } from '../status';

/**
 * Connect My Pool Base Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class Accessory {
  readonly log : Logging;
  readonly service: typeof Service;
  services: Service[] = [];
  constructor(
    readonly platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    readonly accessory: PlatformAccessory,
    device: IDevice,
    status: PoolStatus,
  ) {
    this.service = this.platform.Service;
    this.log = this.platform.log;
    this.accessory.context.device = device;
    this.accessory.context.status = status;
    this.setConfigStatus(status);
    // set accessory information
    this.accessory.getService(this.service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Name, device.deviceName)
      .setCharacteristic(Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(Characteristic.Model, device.deviceType)
      .setCharacteristic(Characteristic.SerialNumber, this.SerialNumber);
    this.setUpServices();

  }

  get device():IDevice {
    return this.accessory.context.device;
  }

  get poolStatus():PoolStatus {
    return this.accessory.context.status;
  }

  get deviceName() {
    return this.device.deviceName;
  }

  get homekitAccessory() {
    return this.accessory;
  }

  get SerialNumber() {
    return '0000.0000.000' + this.device.deviceTypeNumber.toString();
  }

  protected setUpServices() {
    this.log.debug('Creating %s services', this.device.deviceName);
  }

  protected updatePlatform() {
    //this.platform.api.publishExternalAccessories(PLUGIN_NAME, [this.accessory]);
    // Refresh the accessory cache with these values.
    this.platform.api.updatePlatformAccessories([this.accessory]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setConfigStatus(status: PoolStatus) {
    // to be implemented in children classes

  }

  // eslint-disable-next-line no-unused-vars
  async updateStatus(status: PoolStatus) {
    if (status) {
      this.accessory.context.status = status;
      this.setConfigStatus(status);
    }
    // to be implemented in children classes
  }
}