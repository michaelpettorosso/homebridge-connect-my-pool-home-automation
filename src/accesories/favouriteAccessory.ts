import { PlatformAccessory } from 'homebridge';
import { FavouriteDevice } from '../devices/favouriteDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Channel Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FavouriteAccessory extends Accessory {
  constructor(
    platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    accessory: PlatformAccessory,
    device: FavouriteDevice,
    status: PoolStatus,
  ) {
    super(platform, accessory, device, status);

  }

  protected setUpServices() {
    super.setUpServices();
  }
}