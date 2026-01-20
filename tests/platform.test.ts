import { ConnectMyPoolHomebridgePlatform } from '../src/platform';
import { PlatformAccessory } from 'homebridge';
import {
  PLATFORM_NAME,
  API_TEST_KEY
} from '../src/settings';

import { EventEmitter } from 'events';
import { AccessoryType, ChannelAccessoryConfig, LightAccessoryConfig } from '../src/types/accessory';

describe(PLATFORM_NAME, () => {
  let platform: ConnectMyPoolHomebridgePlatform;
  let api: any;
  let log: any;

  beforeEach(() => {
    jest.useFakeTimers();
    log = {
      info: console.info,
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    const setProps = jest.fn();

    const registerPlatformAccessories = jest.fn();

    const MockModeCharacteristic = class {
      static Formats = { UINT8: 'uint8' };
      static Perms = {
        READ: 'pr',
        WRITE: 'pw',
        NOTIFY: 'pn',
      };

      onGet = jest.fn();
      onSet = jest.fn();

      setProps = setProps;
      value: any;

      constructor(public displayName: string, public uuid: string) {}
      getDefaultValue() {
        return 0;
      }
    };


    api = Object.assign(new EventEmitter(), {
      hap: {
        uuid: {
          generate: jest.fn((s: string) => `uuid-${s}`)
        },
        Service: {
          Switch:class {},
          Lightbulb: class {},
          Thermostat: class {}
        },
        Characteristic: {
          Mode: MockModeCharacteristic
        }
      },
      platformAccessory: jest.fn((name: string, uuid: string) => ({
        displayName: name,
        UUID: uuid,
        context: {},
        getService: jest.fn(),
        addService: jest.fn(() => ({
          setCharacteristic: jest.fn(),
          getCharacteristic: jest.fn(() => ({
              Mode: MockModeCharacteristic,
              onGet: jest.fn().mockReturnThis(),
              onSet: jest.fn().mockReturnThis(),
              setProps: jest.fn().mockReturnThis(),
          })),
          updateCharacteristic: jest.fn()
        }))
      }) as unknown as PlatformAccessory),
      registerPlatformAccessories: registerPlatformAccessories,
      unregisterPlatformAccessories: jest.fn(),
      user: {
        persistPath: jest.fn(() => '/tmp')
      }
    }) as any;


    platform = new ConnectMyPoolHomebridgePlatform(
      log,
      {
        platform: PLATFORM_NAME,
        apiKey: API_TEST_KEY,
        polling: {
          intervalMs: 1000
        }
      } as any,
      api
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('adds accessories from poolconfig', async () => {
    const channelConfig = {
      id: 'channel-1',
      name: 'Pump',
      type: 'channel',
    } as ChannelAccessoryConfig;
  jest.spyOn(platform as any, 'loadPoolConfig').mockImplementation(async () => {
    platform['store'].add(channelConfig);
    platform['store'].add({
      id: 'light-1',
      name: 'Light',
      type: AccessoryType.Light,
    } as LightAccessoryConfig)
  });
  // THIS IS REQUIRED
  api.emit('didFinishLaunching');
  await Promise.resolve();

//expect(spy).toHaveBeenCalled();

  expect(api.registerPlatformAccessories).toHaveBeenCalled();
});

it('removes accessory correctly', async () => {
  jest.spyOn(platform as any, 'loadPoolConfig').mockImplementation(async () => {
    platform['store'].add({
      id: 'channel-1',
      name: 'Pump',
      type: 'channel'} as ChannelAccessoryConfig)
    });
  

  // THIS IS REQUIRED
  api.emit('didFinishLaunching');
  await Promise.resolve();

  platform.removeAccessory('channel-1');

  expect(api.unregisterPlatformAccessories).toHaveBeenCalled();
});
});
