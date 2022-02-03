import { PlatformAccessory, Service, Characteristic} from 'homebridge';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { PoolAction } from '../action';
import { SolarSystemConfig } from '../config';
import { ISolarSystemConfigStatus } from '../configStatus';
import { SolarSystemDevice } from '../devices/solarSystemDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { MAX_TARGET_TEMP, MAX_TEMP, MIN_TARGET_TEMP, MIN_TEMP, SolarSystemMode } from '../settings';
import { SolarSystemStatus, PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Solar System Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SolarSystemAccessory extends Accessory {
  private stateCurrentHeatingCooling : number;
  private stateTargetHeatingCooling : number;
  private currentTemperature = MIN_TEMP;
  private currentTargetTemperature = MIN_TARGET_TEMP;
  private solarSystemConfigStatus : ISolarSystemConfigStatus;

  private readonly sunrise : number;
  private readonly sunset : number;

  constructor(
    readonly platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    readonly accessory: PlatformAccessory,
    device: SolarSystemDevice,
    status: PoolStatus,
  ) {
    super(platform, accessory, device, status);
    this.stateCurrentHeatingCooling = this.Characteristic.CurrentHeatingCoolingState.OFF;
    this.stateTargetHeatingCooling = this.Characteristic.TargetHeatingCoolingState.OFF;
    this.solarSystemConfigStatus = this.getSolarSystemConfigStatus(status);
    //looks like bug in library???
    this.sunset = getSunrise(this.platform.config.latitude, this.platform.config.longitude).valueOf();
    this.sunrise = getSunset(this.platform.config.latitude, this.platform.config.longitude).valueOf();

  }

  protected setUpServices() {
    super.setUpServices();
    this.createSolarSystemService();
    this.services[0].setPrimaryService(true);
    this.createPoolTemperatureService();
    //this.createHeaterSensor();
  }

  protected createSolarSystemService(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Thermostat, this.device.deviceType)
                        || this.accessory.addService(this.service.Thermostat, this.device.deviceName, this.device.deviceType);

    zoneService.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .setProps({
        maxValue: this.Characteristic.CurrentHeatingCoolingState.HEAT,
      })
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    zoneService.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .setProps({
        maxValue: this.Characteristic.TargetHeatingCoolingState.HEAT,
      })
      .onGet(this.getTargetHeatingCoolingState.bind(this))
      .onSet(this.setTargetHeatingCoolingState.bind(this));

    zoneService.getCharacteristic(this.Characteristic.CurrentTemperature)
      .setProps({
        maxValue: MAX_TEMP,
        minValue: MIN_TEMP,
        minStep: 1,
      })
      .onGet(this.getCurrentTemperature.bind(this));

    zoneService.getCharacteristic(this.Characteristic.TargetTemperature)
      .setProps({
        maxValue: MAX_TARGET_TEMP,
        minValue: MIN_TARGET_TEMP,
        minStep: 1,
      })
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this));

    zoneService.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
      .setValue(this.Characteristic.TemperatureDisplayUnits.CELSIUS);
    this.services.push(zoneService);
    return zoneService;
  }

  protected createPoolTemperatureService(): Service {
    this.log.debug('Creating %s service for controller', 'Pool Temperature');
    const zoneService = this.accessory.getServiceById(this.service.TemperatureSensor, this.device.deviceType)
                        || this.accessory.addService(this.service.TemperatureSensor, 'Pool Temperature', this.device.deviceType);
    zoneService.getCharacteristic(this.Characteristic.CurrentTemperature)
      .setProps({
        maxValue: MAX_TEMP,
        minValue: MIN_TEMP,
        minStep: 1,
      });
    this.services.push(zoneService);
    return zoneService;
  }

  private isDayTime(): boolean {
    const d = new Date();

    const todayDate = new Date(d.setMinutes(d.getMinutes() - d.getTimezoneOffset())).valueOf();

    const result = (todayDate >= this.sunrise) && (todayDate <= this.sunset);
    this.log.debug('isDayTime', result, todayDate, this.sunrise, this.sunset);
    return result;
  }


  /// /////////////////////
  // GET AND SET CONFIG STATUS
  /// /////////////////////

  protected getSolarSystemConfigStatus(status : PoolStatus): ISolarSystemConfigStatus {
    const currentStatus = status;
    const currentDevice = this.device as SolarSystemDevice;
    const currentConfig = currentDevice.data as SolarSystemConfig;
    if (currentStatus) {
      const solarSystemStatus = currentStatus.solar_systems.find(s => s.solar_number === currentConfig.solar_number);

      const solarSystemConfigStatus : ISolarSystemConfigStatus =
      Object.assign({},
        new SolarSystemStatus(currentConfig.solar_number, true),
        { temperature: currentStatus.temperature },
        currentConfig,
        solarSystemStatus);
      if (solarSystemConfigStatus.set_temperature < MIN_TARGET_TEMP) {
        solarSystemConfigStatus.set_temperature = MIN_TARGET_TEMP;
      }
      if (solarSystemConfigStatus.temperature < MIN_TEMP) {
        solarSystemConfigStatus.temperature = MIN_TEMP;
      }
      this.log.debug('solarSystemConfigStatus', solarSystemConfigStatus);
      return solarSystemConfigStatus;

    } else {
      const solarSystemConfigStatus : ISolarSystemConfigStatus =
      Object.assign({},
        currentConfig,
        new SolarSystemStatus(currentConfig.solar_number));
      this.log.debug('solarSystemConfigStatus', solarSystemConfigStatus);
      return solarSystemConfigStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.solarSystemConfigStatus = this.getSolarSystemConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);
    const currentHeatingCoolingState = this.getCurrentHeatingCoolingState();

    this.services[0].getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .updateValue(currentHeatingCoolingState);

    this.services[0].getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .updateValue(currentHeatingCoolingState);

    //const solarSystemConfigStatus = this.getSolarSystemConfigStatus();
    this.services[0].getCharacteristic(this.Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperature());

    this.services[0].getCharacteristic(this.Characteristic.TargetTemperature)
      .updateValue(this.getTargetTemperature());

    this.services[1].getCharacteristic(this.Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperature());

  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////
  getCurrentTemperature(): number {
    const solarSystemConfigStatus = this.solarSystemConfigStatus;

    if (solarSystemConfigStatus && solarSystemConfigStatus.hasStatus) {
      this.currentTemperature = solarSystemConfigStatus.temperature;
    }
    this.log.debug('getCurrentTemperature:', this.currentTemperature);
    return this.currentTemperature;
  }

  getTargetTemperature(): number {
    const solarSystemConfigStatus = this.solarSystemConfigStatus;

    if (solarSystemConfigStatus && solarSystemConfigStatus.hasStatus) {
      this.currentTargetTemperature = solarSystemConfigStatus.set_temperature;
    }
    this.log.debug('getTargetTemperature:', this.currentTargetTemperature);
    return this.currentTargetTemperature;
  }

  setTargetTemperature(value) {
    this.log.debug('setTargetTemperature:', value);
  }

  getCurrentHeatingCoolingState(): number {
    const solarSystemConfigStatus = this.solarSystemConfigStatus;

    if (solarSystemConfigStatus && solarSystemConfigStatus.hasStatus) {
      const value = solarSystemConfigStatus.mode === SolarSystemMode.OFF ? this.Characteristic.CurrentHeatingCoolingState.OFF
        : (solarSystemConfigStatus.temperature < solarSystemConfigStatus.set_temperature) && this.isDayTime()
          ? this.Characteristic.CurrentHeatingCoolingState.HEAT : this.Characteristic.CurrentHeatingCoolingState.OFF;
      this.stateCurrentHeatingCooling = value;
    }


    this.log.debug('getCurrentHeatingCoolingState:', this.stateCurrentHeatingCooling);
    return this.stateCurrentHeatingCooling;
  }

  getTargetHeatingCoolingState(): number {
    const solarSystemConfigStatus = this.solarSystemConfigStatus;

    if (solarSystemConfigStatus && solarSystemConfigStatus.hasStatus) {
      const value = solarSystemConfigStatus.mode === SolarSystemMode.OFF ? this.Characteristic.TargetHeatingCoolingState.OFF
        : (solarSystemConfigStatus.temperature < solarSystemConfigStatus.set_temperature) && this.isDayTime()
          ? this.Characteristic.TargetHeatingCoolingState.HEAT : this.Characteristic.TargetHeatingCoolingState.OFF;

      this.stateTargetHeatingCooling = value;
    }
    this.log.debug('getTargetHeatingCoolingState', this.stateTargetHeatingCooling);
    return this.stateTargetHeatingCooling;
  }

  setTargetHeatingCoolingState(value) {
    this.log.debug('setTargetHeatingCoolingState:', value, this.stateTargetHeatingCooling);
    if (this.stateTargetHeatingCooling === value) {
      return;
    }
    this.stateTargetHeatingCooling = value;
    this.platform.setPoolAction(PoolAction.SetSolarMode, this.device.deviceTypeNumber, String(value), true).then((res) => {
      this.log.debug('stateTargetHeatingCooling Result', res);
    });
  }

}
