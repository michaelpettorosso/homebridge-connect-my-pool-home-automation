import {
  Mode,
} from './types';
/**
 * ModeCharacteristic.ts
 * 
 * Provides helper functions to convert between accessory modes
 * ('off', 'on', 'auto') and numeric HAP characteristic values.
 * 
 * Use `api.hap.Characteristic` at runtime for actual Homebridge characteristics.
 */


/**
 * Maps Mode to numeric value used in HomeKit characteristics.
 */
export class ModeCharacteristic {
  /**
   * Converts AccessoryMode to numeric HAP value
   * Off = 0, On = 1, Auto = 2
   */
  static toValue(mode: Mode): number {
    switch (mode) {
      case 'off': return 0;
      case 'on': return 1;
      case 'auto': return 2;
      default: return 0;
    }
  }

  /**
   * Converts numeric HAP value back to AccessoryMode
   */
  static fromValue(value: number): Mode {
    switch (value) {
      case 0: return 'off';
      case 1: return 'on';
      case 2: return 'auto';
      default: return 'off';
    }
  }

  /**
   * Helper to create a custom characteristic at runtime
   * Requires api.hap.Characteristic
   */
  static createCharacteristic(apiHap: any, name = 'Mode') {
    const { Characteristic } = apiHap;

    return new Characteristic(name)
      .setProps({
        format: Characteristic.Formats.UINT8,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY],
        maxValue: 2,
        minValue: 0,
        validValues: [0, 1, 2]
      });
  }
}
