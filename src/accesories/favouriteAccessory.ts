import { PlatformAccessory, Service } from 'homebridge';
import { PoolAction } from '../action';
import { FavouriteConfig } from '../config';
import { IFavouriteConfigStatus } from '../configStatus';
import { FavouriteDevice } from '../devices/favouriteDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { FAVOURITE_DEFAULT } from '../settings';
import { FavouriteStatus, KeyValuePair, PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Favourite Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FavouriteAccessory extends Accessory {

  private stateOn = false;
  private stateName: string;
  private favouriteConfigStatus : IFavouriteConfigStatus;

  private readonly favouritesModes: KeyValuePair[] = [];
  constructor(
    platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    accessory: PlatformAccessory,
    device: FavouriteDevice,
    status: PoolStatus,
  ) {
    super(platform, accessory, device, status);
    this.stateName = this.deviceName;
    this.favouriteConfigStatus = this.getFavouritesConfigStatus(status);

    this.favouritesModes.push({ key: 128, value: 'All Off'});
    this.favouritesModes.push({ key: 129, value: 'All Auto'});
    this.favouritesModes.push({ key: FAVOURITE_DEFAULT, value: 'Default'});
  }

  protected setUpServices() {
    super.setUpServices();
    this.createFavouriteServices();
    this.services[0].setPrimaryService(true);
    super.updatePlatform();
  }

  protected createFavouriteServices(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Switch, this.device.deviceType)
                        || this.accessory.addService(this.service.Switch, this.device.deviceName, this.device.deviceType);
    zoneService.getCharacteristic(this.Characteristic.On)
      .onGet(this.getOnState.bind(this))
      .onSet(this.setOnState.bind(this));

    this.services.push(zoneService);
    return zoneService;

  }
  /// /////////////////////
  // GET AND SET CONFIG STATUS
  /// /////////////////////

  protected getFavouritesConfigStatus(status : PoolStatus) : IFavouriteConfigStatus{
    const currentStatus = status;
    const currentDevice = this.device as FavouriteDevice;
    const currentConfig = currentDevice.data as FavouriteConfig;
    if (currentStatus) {
      const configStatus : IFavouriteConfigStatus =
      Object.assign({},
        new FavouriteStatus(currentStatus.active_favourite, true),
        currentConfig);

      this.log.debug('favouriteConfigStatus', configStatus);
      return configStatus;

    } else {
      const configStatus : IFavouriteConfigStatus =
      Object.assign({},
        currentConfig,
        new FavouriteStatus(FAVOURITE_DEFAULT, false));
      this.log.debug('favouriteConfigStatus', configStatus);
      return configStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.favouriteConfigStatus = this.getFavouritesConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);

    this.services[0].getCharacteristic(this.Characteristic.On)
      .updateValue(this.getOnState());
  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////
  getOnState(): boolean {
    const favouriteConfigStatus = this.favouriteConfigStatus;
    const value = favouriteConfigStatus.active_favourite === favouriteConfigStatus.favourite_number ? true : false;
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
    this.platform.setPoolAction(PoolAction.SetActiveFavourite, value ? this.device.deviceTypeNumber : FAVOURITE_DEFAULT, '').then((res) => {
      this.log.debug('setOnState Result', res);
    });
  }
}