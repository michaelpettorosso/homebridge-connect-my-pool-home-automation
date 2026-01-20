import { API } from 'homebridge'
/**
 * ModeCharacteristic.ts
 * 
 * Provides helper functions to convert between accessory modes
 * ('off', 'on', 'auto') and numeric HAP characteristic values.
 * 
 * Use `api.hap.Characteristic` at runtime for actual Homebridge characteristics.
 */

export type Mode = 'off' | 'on' | 'auto'; //no auto for thermostat

/**
 * Maps Mode to numeric value used in HomeKit characteristics.
 */
export class ModeCharacteristic {

  // Stable custom UUID (must never change once published)
  static readonly UUID = '000000E1-0000-1000-8000-135D67EC4377';

  static register(api: API) {
    const Characteristic = api.hap.Characteristic as any;

    // Prevent double-registration
    if (Characteristic.Mode) {
      return;
    }

    class Mode extends Characteristic {
      constructor() {
        super('Mode', ModeCharacteristic.UUID, {
          format: Characteristic.Formats.UINT8,
          perms: [
            Characteristic.Perms.READ,
            Characteristic.Perms.WRITE,
            Characteristic.Perms.NOTIFY,
          ],
          minValue: 0,
          maxValue: 2,
          validValues: [0, 1, 2],
        });

        this.value = this.getDefaultValue();
      }
    }

    // Attach to Characteristic namespace
    Characteristic.Mode = Mode;

  }
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
}
