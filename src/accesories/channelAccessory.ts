import { PlatformAccessory } from 'homebridge';
import { ChannelDevice } from '../devices/channelDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Channel Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ChannelAccessory extends Accessory {
  constructor(
    platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    accessory: PlatformAccessory,
    device: ChannelDevice,
    status: PoolStatus | undefined,
  ) {
    super(platform, accessory, device, status);


  }

  protected setUpServices() {
    //this.createHeaterService();
    //this.services[0].setPrimaryService(true);
    super.setUpServices();
  }


}
