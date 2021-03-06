import { Service, PlatformAccessory } from 'homebridge';
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
  private stateContactOn = this.Characteristic.ContactSensorState.CONTACT_DETECTED;
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
    this.createChannelSensorService();
    super.updatePlatform();
  }

  protected createChannelServices(): Service {
    this.log.debug('Creating %s service for accessory', this.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Switch, this.deviceType)
                        || this.accessory.addService(this.service.Switch, this.deviceName, this.deviceType);
    zoneService.getCharacteristic(this.Characteristic.On)
      .onGet(this.getOnState.bind(this))
      .onSet(this.setOnState.bind(this));

    this.services.push(zoneService);
    return zoneService;
  }

  protected createChannelSensorService(): Service {
    this.log.debug('Creating %s sensor service for accessory', this.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.ContactSensor, this.deviceType)
                        || this.accessory.addService(this.service.ContactSensor, this.deviceName, this.deviceType);
    zoneService.getCharacteristic(this.Characteristic.ContactSensorState)
      .onGet(this.getContactSensorOnState.bind(this));

    zoneService.getCharacteristic(this.Characteristic.Name)
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

      this.debugLog('channelConfigStatus', configStatus);
      return configStatus;

    } else {
      const configStatus : IChannelConfigStatus =
      Object.assign({},
        currentConfig,
        new ChannelStatus(currentConfig.channel_number, false, currentConfig.function));
      this.debugLog('channelConfigStatus', configStatus);
      return configStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.channelConfigStatus = this.getChannelsConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);

    this.services[0].getCharacteristic(this.Characteristic.On)
      .updateValue(this.getOnState());
    this.services[1].getCharacteristic(this.Characteristic.ContactSensorState)
      .updateValue(this.getContactSensorOnState());
    this.services[1].getCharacteristic(this.Characteristic.Name)
      .updateValue(this.getNameState());
  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////
  getContactSensorOnState(): number {
    const value = this.getOnState() ?
      this.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED:
      this.Characteristic.ContactSensorState.CONTACT_DETECTED;
    this.debugLog('getContactSensorOnState', value);
    this.stateContactOn = value;
    return this.stateContactOn;
  }

  getOnState(): boolean {
    const channelConfigStatus = this.channelConfigStatus;
    const value = channelConfigStatus.mode <= ChannelsMode.AUTO ? false : true;
    this.debugLog('getOnState', value);
    this.stateOn = value;
    return this.stateOn;
  }

  setOnState(value) {
    this.debugLog('setOnState', value);
    if (this.stateOn === value) {
      return;
    }
    this.stateOn = value;
    this.platform.setPoolAction(PoolAction.CycleChanelMode, this.device.deviceTypeNumber).then((res) => {
      this.debugLog('setOnState Result', res);
    });
  }

  getNameState(): string {
    const channelConfigStatus = this.channelConfigStatus;
    const value = !this.getOnState() ?
      this.deviceName : this.deviceName + '-' + this.channelsModes.find(kv => kv.key === channelConfigStatus.mode)?.value;
    this.debugLog('getNameState', value);
    this.stateName = value;
    return this.stateName;
  }
}