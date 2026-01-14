import { AccessoryStore } from '../AccessoryStore';
import { RateLimiter } from '../RateLimiter';
import { RemoteAccessoryConfig } from '../types';
import { API } from 'homebridge';

describe('AccessoryStore', () => {
  let store: AccessoryStore;
  let log: any;
  let api: API;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    log = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    rateLimiter = new RateLimiter(0);

    api = {
      hap: {
        Characteristic: class {
          name: string;
          constructor(name: string) { this.name = name; }
          setProps(props: any) { return this; }
          onGet(cb: any) { return this; }
          onSet(cb: any) { return this; }
        },
        uuid: {
          generate: jest.fn((s: string) => `uuid-${s}`), // ✅ important
        },
        Service: { Switch: jest.fn(), Lightbulb: jest.fn(), Thermostat: jest.fn() }
      },
      platformAccessory: jest.fn(),
      registerPlatformAccessories: jest.fn(),   // ✅ add this
      unregisterPlatformAccessories: jest.fn(), // ✅ add this
    } as unknown as API;

    store = new AccessoryStore(log, api, rateLimiter);
  });

  it('adds an accessory and reads state', () => {
    const config: RemoteAccessoryConfig = { id: '1', name: 'Switch', type: 'switch', mode: 'off' };
    store.add(config);
    expect(store.getState('1')).toBe('off');
    expect(api.hap.uuid.generate).toHaveBeenCalledWith('connectmypool:switch:1');

  });
});
