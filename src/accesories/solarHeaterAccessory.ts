import { PlatformAccessory, Service } from 'homebridge';
import { SolarHeaterDevice } from '../devices/solarHeaterDevice';

import { ConnectMyPoolHomeAutomationHomebridgePlatform } from '../platform';
import { PoolStatus } from '../status';
import { Accessory } from './accessory';

/**
 * Solar Heater  Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SolarHeaterAccessory extends Accessory {
  constructor(
    readonly platform: ConnectMyPoolHomeAutomationHomebridgePlatform,
    readonly accessory: PlatformAccessory,
    device: SolarHeaterDevice,
    status: PoolStatus | undefined,
  ) {
    super(platform, accessory, device, status);

  }

  protected setUpServices() {
    super.setUpServices();
    this.createSolarHeaterService();
    this.services[0].setPrimaryService(true);
    this.createPoolTemperatureService();
    //this.createHeaterSensor();
  }

  protected createSolarHeaterService(): Service {
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

  async updateStatus(status: PoolStatus | undefined) {
    await super.updateStatus(status);
    this.log.debug(`setStatus ${SolarHeaterDevice.type}`, status);
    //this.characteristic.CurrentHeatingCoolingState.HEAT;

    const currentstatus = this.status;
    const currentdevice = this.device;
    if (currentstatus) {

      const solarheater = currentstatus.solar_systems.find(h => h.solar_number === currentdevice.deviceTypeNumber);
      if (solarheater) {

        const state = solarheater.mode === 0 ? this.characteristic.CurrentHeatingCoolingState.OFF
          : currentstatus.temperature < solarheater.set_temperature ?
            this.characteristic.CurrentHeatingCoolingState.HEAT : this.characteristic.CurrentHeatingCoolingState.OFF;

        this.services[0].getCharacteristic(this.characteristic.CurrentHeatingCoolingState)
          .updateValue(state);

        this.services[0].getCharacteristic(this.characteristic.TargetHeatingCoolingState)
          .updateValue(state);

        this.services[0].getCharacteristic(this.characteristic.CurrentTemperature)
          .updateValue(currentstatus.temperature);

        this.services[0].getCharacteristic(this.characteristic.TargetTemperature)
          .updateValue(solarheater.set_temperature);

        this.services[1].getCharacteristic(this.characteristic.CurrentTemperature)
          .updateValue(currentstatus.temperature);

        // this.services[1].getCharacteristic(this.characteristic.Name)
        //   .updateValue(currentstatus.pool_spa_selection === 0 ? 'Spa Temperature' :'Pool Temperature');

        //   .updateValue(solarheater.mode === 0
        //     ? this.characteristic.ContactSensorState.CONTACT_NOT_DETECTED : this.characteristic.ContactSensorState.CONTACT_DETECTED);





      }
    }
  }
  // "solar_systems": [
  //  {
  //    "solar_number": 3,
  //    "mode": 1,
  //    "set_temperature": 28
  //}
}
