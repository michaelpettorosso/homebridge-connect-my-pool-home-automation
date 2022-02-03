import { Service, PlatformAccessory } from 'homebridge';
import { Characteristic } from 'hap-nodejs';
import { PoolAction } from '../action';
import { ChannelDevice } from '../devices/channelDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { ChannelStatus, KeyValuePair, PoolStatus } from '../status';
import { Accessory } from './accessory';
import { IChannelConfigStatus } from '../configStatus';
import { ChannelConfig } from '../config';
import { ChannelsMode } from '../settings';

/**
 * Channel Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ChannelAccessory extends Accessory {
  private stateOn = false;
  private stateName: string;
  private channelConfigStatus : IChannelConfigStatus;

  private readonly channelsModes: KeyValuePair[] = [];
  constructor(
    platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    accessory: PlatformAccessory,
    device: ChannelDevice,
    status: PoolStatus,
  ) {
    super(platform, accessory, device, status);
    this.stateName = this.deviceName;
    this.channelConfigStatus = this.getChannelsConfigStatus(status);

    this.channelsModes.push({ key: 0, value: 'Off'});
    this.channelsModes.push({ key: 1, value: 'Auto'});
    this.channelsModes.push({ key: 2, value: 'On'});
    this.channelsModes.push({ key: 3, value: 'Low Speed'});
    this.channelsModes.push({ key: 4, value: 'Medium Speed'});
    this.channelsModes.push({ key: 5, value: 'High Speed'});
  }

  protected setUpServices() {
    super.setUpServices();
    this.createChannelServices();
    this.services[0].setPrimaryService(true);
    super.updatePlatform();
  }

  protected createChannelServices(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.StatefulProgrammableSwitch, this.device.deviceType)
                        || this.accessory.addService(this.service.StatefulProgrammableSwitch, this.getNameState, this.device.deviceType);
    zoneService.getCharacteristic(Characteristic.On)
      .onGet(this.getOnState.bind(this))
      .onSet(this.setOnState.bind(this));

    zoneService.getCharacteristic(Characteristic.Name)
      .onGet(this.getNameState.bind(this));

    this.services.push(zoneService);
    return zoneService;

  }
  /// /////////////////////
  // GET AND SET CONFIG STATUS
  /// /////////////////////

  protected getChannelsConfigStatus(status : PoolStatus) : IChannelConfigStatus{
    const currentStatus = status;
    const currentDevice = this.device as ChannelDevice;
    const currentConfig = currentDevice.data as ChannelConfig;
    if (currentStatus) {
      const channelStatus = currentStatus.channels.find(h => h.channel_number === currentConfig.channel_number);

      const configStatus : IChannelConfigStatus =
      Object.assign({},
        new ChannelStatus(currentConfig.channel_number, true, currentConfig.function),
        currentConfig, channelStatus);

      this.log.debug('channelConfigStatus', configStatus);
      return configStatus;

    } else {
      const configStatus : IChannelConfigStatus =
      Object.assign({},
        currentConfig,
        new ChannelStatus(currentConfig.channel_number, false, currentConfig.function));
      this.log.debug('channelConfigStatus', configStatus);
      return configStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.channelConfigStatus = this.getChannelsConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);

    this.services[0].getCharacteristic(Characteristic.On)
      .updateValue(this.getOnState());
    this.services[0].getCharacteristic(Characteristic.Name)
      .setValue(this.getNameState());
  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////
  getOnState(): boolean {
    const channelConfigStatus = this.channelConfigStatus;
    const value = channelConfigStatus.mode === ChannelsMode.OFF ? false : true;
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
    this.platform.setPoolAction(PoolAction.CycleChanelMode, this.device.deviceTypeNumber, '').then((res) => {
      this.log.debug('setOnState Result', res);
    });
  }

  getNameState(): string {
    const channelConfigStatus = this.channelConfigStatus;
    const value = channelConfigStatus.mode === ChannelsMode.OFF ?
      this.deviceName : this.deviceName + '-' + this.channelsModes.find(kv => kv.key === channelConfigStatus.mode)?.value;
    this.log.debug('getNameState', value);
    this.stateName = value;
    return this.stateName;
  }
}