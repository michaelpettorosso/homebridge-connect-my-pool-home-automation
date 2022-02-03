import { Service, PlatformAccessory } from 'homebridge';
import { Characteristic } from 'hap-nodejs';
import { PoolAction } from '../action';
import { HeaterConfig } from '../config';
import { IHeaterConfigStatus } from '../configStatus';
import { HeaterDevice } from '../devices/heaterDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { HeatersMode, MAX_TARGET_TEMP, MAX_TEMP, MIN_TARGET_TEMP, MIN_TEMP, PoolSpaSelection } from '../settings';
import { HeaterStatus, PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Heater Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HeaterAccessory extends Accessory {
  private stateCurrentHeatingCooling = Characteristic.CurrentHeatingCoolingState.OFF;
  private stateTargetHeatingCooling = Characteristic.TargetHeatingCoolingState.OFF;
  private currentTemperature = MIN_TEMP;
  private currentTargetTemperature = MIN_TARGET_TEMP;
  private stateSpaOn = false;
  private statePoolTemperatureName: string;
  private heaterConfigStatus : IHeaterConfigStatus;
  constructor(
    readonly platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    readonly accessory: PlatformAccessory,
    device: HeaterDevice,
    status: PoolStatus,
  ) {
    super(platform, accessory, device, status);
    this.heaterConfigStatus = this.getHeaterConfigStatus(status);
    this.statePoolTemperatureName = 'Pool Temperature';
  }

  protected setUpServices() {
    super.setUpServices();

    this.createHeaterService();
    this.services[0].setPrimaryService(true);

    this.createPoolTemperatureService();
    if ((this.device as HeaterDevice).hasPoolSpaSelectionEnabled) {
      this.createPoolSpaService();
    }
    super.updatePlatform();

  }

  protected createHeaterService(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Thermostat, this.device.deviceType)
                        || this.accessory.addService(this.service.Thermostat, this.device.deviceName, this.device.deviceType);

    zoneService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .setProps({
        maxValue: Characteristic.CurrentHeatingCoolingState.HEAT,
      })
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    zoneService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        maxValue: Characteristic.TargetHeatingCoolingState.HEAT,
      })
      .onGet(this.getTargetHeatingCoolingState.bind(this))
      .onSet(this.setTargetHeatingCoolingState.bind(this));

    zoneService.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        maxValue: MAX_TEMP,
        minValue: MIN_TEMP,
        minStep: 1,
      })
      .onGet(this.getCurrentTemperature.bind(this));

    zoneService.getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        maxValue: MAX_TARGET_TEMP,
        minValue: MIN_TARGET_TEMP,
        minStep: 1,
      })
      .onGet(this.getTargetTemperature.bind(this))
      .onSet(this.setTargetTemperature.bind(this));

    zoneService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .setValue(Characteristic.TemperatureDisplayUnits.CELSIUS);
    this.services.push(zoneService);
    return zoneService;
  }

  protected createPoolSpaService(): Service {
    this.log.debug('Creating %s service for controller', 'Pool Spa Switch');
    const zoneService = this.accessory.getServiceById(this.service.Switch, this.device.deviceType)
                        || this.accessory.addService(this.service.Switch, 'Spa On', this.device.deviceType);
    zoneService.getCharacteristic(Characteristic.On)
      .onSet(this.setSpaOnState.bind(this))
      .onGet(this.getSpaOnState.bind(this));
    this.services.push(zoneService);
    return zoneService;
  }

  protected createPoolTemperatureService(): Service {
    this.log.debug('Creating %s service for controller', 'Pool Temperature');
    const zoneService = this.accessory.getServiceById(this.service.TemperatureSensor, this.device.deviceType)
                        || this.accessory.addService(this.service.TemperatureSensor, 'Pool Temperature', this.device.deviceType);
    zoneService.getCharacteristic(Characteristic.CurrentTemperature)
      .setProps({
        maxValue: MAX_TEMP,
        minValue: MIN_TEMP,
        minStep: 1,
      });
    zoneService.getCharacteristic(Characteristic.Name)
      .onGet(this.getPoolTemperatureName.bind(this));
    this.services.push(zoneService);
    return zoneService;
  }

  /// /////////////////////
  // GET AND SET CONFIG STATUS
  /// /////////////////////

  protected getHeaterConfigStatus(status : PoolStatus) : IHeaterConfigStatus{
    const currentStatus = status;
    const currentDevice = this.device as HeaterDevice;
    const currentConfig = currentDevice.data as HeaterConfig;
    if (currentStatus) {
      const heaterStatus = currentStatus.heaters.find(h => h.heater_number === currentConfig.heater_number);

      const configStatus : IHeaterConfigStatus =
      Object.assign({},
        new HeaterStatus(currentConfig.heater_number, true, currentDevice.hasPoolSpaSelectionEnabled),
        {
          temperature: currentStatus.temperature,
          pool_spa_selection: currentStatus.pool_spa_selection,
        },
        currentConfig, heaterStatus);
      if (configStatus.set_temperature < MIN_TARGET_TEMP) {
        configStatus.set_temperature = MIN_TARGET_TEMP;
      }
      if (configStatus.spa_set_temperature < MIN_TARGET_TEMP) {
        configStatus.spa_set_temperature = MIN_TARGET_TEMP;
      }
      if (configStatus.temperature < MIN_TEMP) {
        configStatus.temperature = MIN_TEMP;
      }
      this.log.debug('heaterConfigStatus', configStatus);
      return configStatus;

    } else {
      const configStatus : IHeaterConfigStatus =
      Object.assign({},
        currentConfig,
        new HeaterStatus(currentConfig.heater_number));
      this.log.debug('heaterConfigStatus', configStatus);
      return configStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.heaterConfigStatus = this.getHeaterConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);
    const currentHeatingCoolingState = this.getCurrentHeatingCoolingState();

    this.services[0].getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .updateValue(currentHeatingCoolingState);

    this.services[0].getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .updateValue(currentHeatingCoolingState);

    this.services[0].getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperature());

    this.services[0].getCharacteristic(Characteristic.TargetTemperature)
      .updateValue(this.getTargetTemperature());

    this.services[1].getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperature());
    this.services[1].getCharacteristic(Characteristic.Name)
      .updateValue(this.getPoolTemperatureName());

    if ((this.device as HeaterDevice).hasPoolSpaSelectionEnabled) {
      this.services[2].getCharacteristic(Characteristic.On)
        .updateValue(this.getSpaOnState());
    }
  }

  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////
  getSpaOnState(): boolean{
    const heaterConfigStatus = this.heaterConfigStatus;
    if (heaterConfigStatus.hasStatus) {
      this.stateSpaOn = heaterConfigStatus.pool_spa_selection === PoolSpaSelection.SPA;
    }
    this.log.debug('getSpaOnState:', this.stateSpaOn);
    return this.stateSpaOn;
  }

  setSpaOnState(value){
    this.log.debug('setSpaOnState:', value, this.stateSpaOn);
    if (this.stateSpaOn === value) {
      return;
    }
    this.stateSpaOn = value;
    this.platform.setPoolAction(
      PoolAction.SetPoolSpaSelection,
      this.device.deviceTypeNumber,
      String(value ? PoolSpaSelection.SPA: PoolSpaSelection.POOL),
      true)
      .then((res) => {
        this.log.debug('setSpaOnState Result', res);
      });
  }

  getCurrentTemperature(): number {
    const heaterConfigStatus = this.heaterConfigStatus;

    if (heaterConfigStatus.hasStatus) {
      this.currentTemperature = heaterConfigStatus.temperature;
    }

    this.log.debug('getCurrentTemperature:', this.currentTemperature);
    return this.currentTemperature;
  }

  getTargetTemperature(): number {
    const heaterConfigStatus = this.heaterConfigStatus;
    if (heaterConfigStatus.hasStatus) {
      const value = heaterConfigStatus.pool_spa_selection === PoolSpaSelection.SPA
        ? heaterConfigStatus.spa_set_temperature : heaterConfigStatus.set_temperature;
      this.currentTargetTemperature = value;
    }
    this.log.debug('getTargetTemperature:', this.currentTargetTemperature);
    return this.currentTargetTemperature;
  }

  setTargetTemperature(value) {
    this.log.debug('setTargetTemperature:', value, this.currentTargetTemperature);
    if (this.currentTargetTemperature === value) {
      return;
    }
    this.currentTargetTemperature = value;
    this.platform.setPoolAction(PoolAction.SetHeaterSetTemperature, this.device.deviceTypeNumber, String(value), true).then((res) => {
      this.log.debug('setTargetTemperature Result', res);
    });
  }

  getCurrentHeatingCoolingState(): number {
    const heaterConfigStatus = this.heaterConfigStatus;

    if (heaterConfigStatus.hasStatus) {
      this.stateCurrentHeatingCooling = heaterConfigStatus.mode;
    }
    this.log.debug('getCurrentHeatingCoolingState:', this.stateCurrentHeatingCooling);
    return this.stateCurrentHeatingCooling;
  }

  getTargetHeatingCoolingState(): number {
    const heaterConfigStatus = this.heaterConfigStatus;

    if (heaterConfigStatus.hasStatus) {
      const value = heaterConfigStatus.mode === HeatersMode.OFF ? Characteristic.TargetHeatingCoolingState.OFF
        : Characteristic.TargetHeatingCoolingState.HEAT;
      this.stateTargetHeatingCooling = value;
    }
    this.log.debug('getTargetHeatingCoolingState:', this.stateTargetHeatingCooling);
    return this.stateTargetHeatingCooling;
  }

  setTargetHeatingCoolingState(value) {
    this.log.debug('setTargetHeatingCoolingState:', value, this.stateTargetHeatingCooling);
    if (this.stateTargetHeatingCooling === value) {
      return;
    }
    this.stateTargetHeatingCooling = value;
    this.platform.setPoolAction(PoolAction.SetHeaterMode, this.device.deviceTypeNumber, String(value), true).then((res) => {
      this.log.debug('stateTargetHeatingCooling Result', res);
    });
  }

  getPoolTemperatureName(): string{
    const heaterConfigStatus = this.heaterConfigStatus;
    if (heaterConfigStatus.hasStatus) {
      const value =this.heaterConfigStatus.pool_spa_selection === PoolSpaSelection.SPA ? 'Spa Temperature' :'Pool Temperature';
      this.statePoolTemperatureName = value;
    }
    this.log.debug('getPoolTemperatureName:', this.statePoolTemperatureName);
    return this.statePoolTemperatureName;
  }

}