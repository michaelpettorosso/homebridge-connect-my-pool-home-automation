import { Service, PlatformAccessory} from 'homebridge';
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
  private stateCurrentHeatingCooling : number;
  private stateTargetHeatingCooling : number;
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
    this.stateCurrentHeatingCooling = this.Characteristic.CurrentHeatingCoolingState.OFF;
    this.stateTargetHeatingCooling = this.Characteristic.TargetHeatingCoolingState.OFF;
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
    this.log.debug('Creating %s service for accessory', this.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Thermostat, this.deviceType)
                        || this.accessory.addService(this.service.Thermostat, this.deviceName, this.deviceType);

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

  protected createPoolSpaService(): Service {
    this.log.debug('Creating %s service for accessory', 'Pool Spa Switch');
    const zoneService = this.accessory.getServiceById(this.service.Switch, this.deviceType)
                        || this.accessory.addService(this.service.Switch, 'Spa On', this.deviceType);
    zoneService.getCharacteristic(this.Characteristic.On)
      .onSet(this.setSpaOnState.bind(this))
      .onGet(this.getSpaOnState.bind(this));
    this.services.push(zoneService);
    return zoneService;
  }

  protected createPoolTemperatureService(): Service {
    this.log.debug('Creating %s service for accessory', 'Pool Temperature');
    const zoneService = this.accessory.getServiceById(this.service.TemperatureSensor, this.deviceType)
                        || this.accessory.addService(this.service.TemperatureSensor, 'Pool Temperature', this.deviceType);
    zoneService.getCharacteristic(this.Characteristic.CurrentTemperature)
      .setProps({
        maxValue: MAX_TEMP,
        minValue: MIN_TEMP,
        minStep: 1,
      });
    zoneService.getCharacteristic(this.Characteristic.Name)
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
      this.debugLog('heaterConfigStatus', configStatus);
      return configStatus;

    } else {
      const configStatus : IHeaterConfigStatus =
      Object.assign({},
        currentConfig,
        new HeaterStatus(currentConfig.heater_number));
      this.debugLog('heaterConfigStatus', configStatus);
      return configStatus;
    }
  }

  setConfigStatus(status : PoolStatus) {
    this.heaterConfigStatus = this.getHeaterConfigStatus(status);
  }

  async updateStatus(status: PoolStatus) {
    await super.updateStatus(status);
    const currentHeatingCoolingState = this.getCurrentHeatingCoolingState();

    this.services[0].getCharacteristic(this.Characteristic.CurrentHeatingCoolingState)
      .updateValue(currentHeatingCoolingState);

    this.services[0].getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .updateValue(currentHeatingCoolingState);

    this.services[0].getCharacteristic(this.Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperature());

    this.services[0].getCharacteristic(this.Characteristic.TargetTemperature)
      .updateValue(this.getTargetTemperature());

    this.services[1].getCharacteristic(this.Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperature());
    this.services[1].getCharacteristic(this.Characteristic.Name)
      .updateValue(this.getPoolTemperatureName());

    if ((this.device as HeaterDevice).hasPoolSpaSelectionEnabled) {
      this.services[2].getCharacteristic(this.Characteristic.On)
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
    this.debugLog('getSpaOnState:', this.stateSpaOn);
    return this.stateSpaOn;
  }

  setSpaOnState(value){
    this.debugLog('setSpaOnState:', value, this.stateSpaOn);
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
        this.debugLog('setSpaOnState Result', res);
      });
  }

  getCurrentTemperature(): number {
    const heaterConfigStatus = this.heaterConfigStatus;

    if (heaterConfigStatus.hasStatus) {
      this.currentTemperature = heaterConfigStatus.temperature;
    }

    this.debugLog('getCurrentTemperature:', this.currentTemperature);
    return this.currentTemperature;
  }

  getTargetTemperature(): number {
    const heaterConfigStatus = this.heaterConfigStatus;
    if (heaterConfigStatus.hasStatus) {
      const value = heaterConfigStatus.pool_spa_selection === PoolSpaSelection.SPA
        ? heaterConfigStatus.spa_set_temperature : heaterConfigStatus.set_temperature;
      this.currentTargetTemperature = value;
    }
    this.debugLog('getTargetTemperature:', this.currentTargetTemperature);
    return this.currentTargetTemperature;
  }

  setTargetTemperature(value) {
    this.debugLog('%s setTargetTemperature:', value, this.currentTargetTemperature);
    if (this.currentTargetTemperature === value) {
      return;
    }
    this.currentTargetTemperature = value;
    this.platform.setPoolAction(PoolAction.SetHeaterSetTemperature, this.device.deviceTypeNumber, String(value), true).then((res) => {
      this.debugLog('setTargetTemperature Result', res);
    });
  }

  getCurrentHeatingCoolingState(): number {
    const heaterConfigStatus = this.heaterConfigStatus;

    if (heaterConfigStatus.hasStatus) {
      this.stateCurrentHeatingCooling = heaterConfigStatus.mode;
    }
    this.debugLog('getCurrentHeatingCoolingState:', this.stateCurrentHeatingCooling);
    return this.stateCurrentHeatingCooling;
  }

  getTargetHeatingCoolingState(): number {
    const heaterConfigStatus = this.heaterConfigStatus;

    if (heaterConfigStatus.hasStatus) {
      const value = heaterConfigStatus.mode === HeatersMode.OFF ? this.Characteristic.TargetHeatingCoolingState.OFF
        : this.Characteristic.TargetHeatingCoolingState.HEAT;
      this.stateTargetHeatingCooling = value;
    }
    this.debugLog('getTargetHeatingCoolingState:', this.stateTargetHeatingCooling);
    return this.stateTargetHeatingCooling;
  }

  setTargetHeatingCoolingState(value) {
    this.debugLog('setTargetHeatingCoolingState:', value, this.stateTargetHeatingCooling);
    if (this.stateTargetHeatingCooling === value) {
      return;
    }
    this.stateTargetHeatingCooling = value;
    this.platform.setPoolAction(PoolAction.SetHeaterMode, this.device.deviceTypeNumber, String(value), true).then((res) => {
      this.debugLog('stateTargetHeatingCooling Result', res);
    });
  }

  getPoolTemperatureName(): string{
    const heaterConfigStatus = this.heaterConfigStatus;
    if (heaterConfigStatus.hasStatus) {
      const value =this.heaterConfigStatus.pool_spa_selection === PoolSpaSelection.SPA ? 'Spa Temperature' :'Pool Temperature';
      this.statePoolTemperatureName = value;
    }
    this.debugLog('getPoolTemperatureName:', this.statePoolTemperatureName);
    return this.statePoolTemperatureName;
  }
}