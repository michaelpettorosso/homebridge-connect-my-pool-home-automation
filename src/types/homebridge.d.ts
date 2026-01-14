import { Characteristic } from 'homebridge';

declare module 'homebridge' {
  interface Characteristic {
    Mode?: typeof import('../ModeCharacteristic').ModeCharacteristic;
  }
}
