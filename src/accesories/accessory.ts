/* eslint-disable @typescript-eslint/no-empty-function */
import { Logging, PlatformAccessory, Service, Characteristic } from 'homebridge';
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
  readonly Characteristic: typeof Characteristic;
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
    this.Characteristic = this.platform.api.hap.Characteristic;
    // set accessory information
    this.accessory.getService(this.service.AccessoryInformation)!
      .setCharacteristic(this.Characteristic.Name, device.deviceName)
      .setCharacteristic(this.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.Characteristic.Model, device.deviceType)
      .setCharacteristic(this.Characteristic.SerialNumber, this.SerialNumber);
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

  get deviceType() {
    return this.device.deviceType;
  }

  get homekitAccessory() {
    return this.accessory;
  }

  get SerialNumber() {
    return '0000.0000.000' + this.device.deviceTypeNumber.toString();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected debugLog(message: string, ...parameters: any[]): void {
    this.log.debug('[%s] %s', this.deviceName, message, ...parameters);
  }

  protected setUpServices() {
    this.log.debug('Creating %s services', this.deviceName);
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

  async updateStatus(status: PoolStatus) {
    if (status) {
      this.accessory.context.status = status;
      this.setConfigStatus(status);
    }
    // to be implemented in children classes
  }
}