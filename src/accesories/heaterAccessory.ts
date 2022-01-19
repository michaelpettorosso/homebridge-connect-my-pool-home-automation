import { Service, PlatformAccessory } from 'homebridge';
import { HeaterDevice } from '../devices/heaterDevice';
import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { PLUGIN_NAME } from '../settings';
import { PoolStatus } from '../status';

import { Accessory } from './accessory';

/**
 * Solar Heater  Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HeaterAccessory extends Accessory {
  constructor(
    readonly platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    readonly accessory: PlatformAccessory,
    device: HeaterDevice,
    status: PoolStatus | undefined,
  ) {
    super(platform, accessory, device, status);

  }

  protected setUpServices() {
    super.setUpServices();

    this.createHeaterService();
    this.services[0].setPrimaryService(true);
    this.createPoolTemperatureService();

    super.updatePlatform();

  }

  protected createHeaterService(): Service {
    this.log.debug('Creating %s service for controller', this.device.deviceName);
    const zoneService = this.accessory.getServiceById(this.service.Thermostat, this.device.deviceType)
                        || this.accessory.addService(this.service.Thermostat, this.device.deviceName, this.device.deviceType);
    //zoneService.setCharacteristic(this.Characteristic.ConfiguredName, this.name)
    zoneService.getCharacteristic(this.characteristic.CurrentHeatingCoolingState)
      .setProps({
        maxValue: this.characteristic.CurrentHeatingCoolingState.HEAT,
      });
    zoneService.getCharacteristic(this.characteristic.TargetHeatingCoolingState)
      .setProps({
        maxValue: this.characteristic.TargetHeatingCoolingState.HEAT,
      });
    //.onSet(this.setTargetHeatingCoolingState.bind(this));
    zoneService.getCharacteristic(this.characteristic.CurrentTemperature)
      .setProps({
        maxValue: 50,
        minStep: 1,
      });
    zoneService.getCharacteristic(this.characteristic.TargetTemperature)
      .setProps({
        maxValue: 40,
        minStep: 1,
      });
    //.onSet(this.setTargetTemperature.bind(this));
    zoneService.getCharacteristic(this.characteristic.TemperatureDisplayUnits)
      .setValue(this.characteristic.TemperatureDisplayUnits.CELSIUS);
    this.services.push(zoneService);
    return zoneService;
  }

  protected createPoolTemperatureService(): Service {
    this.log.debug('Creating %s service for controller', 'Pool Temperature');
    const zoneService = this.accessory.getServiceById(this.service.TemperatureSensor, this.device.deviceType)
                        || this.accessory.addService(this.service.TemperatureSensor, 'Pool Temperature', this.device.deviceType);
    zoneService.getCharacteristic(this.characteristic.CurrentTemperature)
      .setProps({
        maxValue: 50,
        minStep: 1,
      });
    this.services.push(zoneService);
    return zoneService;
  }


  /// /////////////////////
  // GET AND SET FUNCTIONS
  /// /////////////////////

  /**
     * Handle requests to set the "Target Heating Cooling State" characteristic
     */
  setTargetHeatingCoolingState(value) {
    this.log.debug('Set TargetHeatingCoolingState:', value);
  }

  /**
     * Handle requests to get the current value of the "Is Active" characteristic
     */
  getIsRunning() {
    let _a;
    const status = this.accessory.context.status;

    const heater = status.heaters.find(e => e.heater_number === this.device.deviceTypeNumber);
    // set this to a valid value for CurrentTemperature
    const value = (_a = status === null || status === void 0 ? void 0 : status.isRunning) !== null && _a !== void 0 ? _a : false;
    this.log.debug('Get Is Running:', value);
    return value;
  }

  /**
     * Handle requests to set the "Target Temperature" characteristic
     */
  setTargetTemperature(value) {
    this.log.debug('Set TargetTemperature:', value);
  }

  async updateStatus(status: PoolStatus | undefined) {
    await super.updateStatus(status);
    this.log.debug(`setStatus ${HeaterDevice.type}`, status);
    //this.characteristic.CurrentHeatingCoolingState.HEAT;

    const currentstatus = this.status;
    const currentdevice = this.device;
    if (currentstatus) {

      const heater = currentstatus.heaters.find(h => h.heater_number === currentdevice.deviceTypeNumber);
      if (heater) {

        const state = heater.mode === 0 ? this.characteristic.CurrentHeatingCoolingState.OFF
          : currentstatus.pool_spa_selection === 0 ? currentstatus.temperature < heater.spa_set_temperature
            ? this.characteristic.CurrentHeatingCoolingState.HEAT : this.characteristic.CurrentHeatingCoolingState.OFF
            : currentstatus.temperature < heater.set_temperature ?
              this.characteristic.CurrentHeatingCoolingState.HEAT : this.characteristic.CurrentHeatingCoolingState.OFF;

        this.services[0].getCharacteristic(this.characteristic.CurrentHeatingCoolingState)
          .updateValue(state);

        this.services[0].getCharacteristic(this.characteristic.TargetHeatingCoolingState)
          .updateValue(state);
        this.services[0].getCharacteristic(this.characteristic.CurrentTemperature)
          .updateValue(currentstatus.temperature);

        this.services[0].getCharacteristic(this.characteristic.TargetTemperature)
          .updateValue(currentstatus.pool_spa_selection === 0
            ? heater.spa_set_temperature : heater.set_temperature);

        this.services[1].getCharacteristic(this.characteristic.CurrentTemperature)
          .updateValue(currentstatus.temperature);

        this.services[1].getCharacteristic(this.characteristic.Name)
          .updateValue(currentstatus.pool_spa_selection === 0 ? 'Spa Temperature' :'Pool Temperature');





      }
      // pool_spa_selection: 1,
      // heat_cool_selection: 1,
      // temperature: 28,
      // active_favourite: 255,
      // heaters: [
      //   {
      //     heater_number: 1,
      //     mode: 0,
      //     set_temperature: 28,
      //     spa_set_temperature: 37
      //   }
      // ],

      // this.s

    //this.services[0].updateCharacteristic(this.characteristic.MotionDetected, !motionDetected);
    }
  }

}
