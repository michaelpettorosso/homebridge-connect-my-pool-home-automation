import { AccessoryStore } from '../AccessoryStore';
import { RateLimiter } from '../RateLimiter';
import { RemoteAccessoryConfig } from '../types';
import {
  BASE_URL,
  API_TEST_KEY
} from '../settings';

import { API } from 'homebridge';

describe('AccessoryStore', () => {
  let store: AccessoryStore;
  let log: any;
  let api: API;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    
    const mockService = {
        getCharacteristic: jest.fn().mockReturnValue({
          onSet: jest.fn(),
          updateValue: jest.fn(),
        }),
        addCharacteristic: jest.fn().mockReturnValue({
          onSet: jest.fn(),
        }),
      };


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
      platformAccessory: jest.fn().mockImplementation(() => ({
        context: {},
        getService: jest.fn().mockReturnValue(undefined),
        addService: jest.fn().mockReturnValue(mockService),
      })),

      registerPlatformAccessories: jest.fn(),   // ✅ add this
      unregisterPlatformAccessories: jest.fn(), // ✅ add this
    } as unknown as API;

    log = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    rateLimiter = new RateLimiter(0);
    store = new AccessoryStore(
                  log,
                  api,
                  rateLimiter,
                  API_TEST_KEY,
                  BASE_URL
                );

  });

  it('adds an accessory and reads state', () => {
    const config: RemoteAccessoryConfig = { id: '1', name: 'Switch', type: 'light', mode: 'off' };
    store.add(config);
    expect(store.getState('1')).toBe('off');
    expect(api.hap.uuid.generate).toHaveBeenCalledWith('connectmypool:light:1');

  });
});
