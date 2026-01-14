import { ApiPlatform } from '../platform';
import { PlatformAccessory } from 'homebridge';

describe('ApiPlatform', () => {
  let platform: ApiPlatform;
  let api: any;
  let log: any;

  beforeEach(() => {
    log = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    api = {
      hap: {
        uuid: {
          generate: jest.fn((s: string) => `uuid-${s}`)
        },
        Service: {
          Switch: class {},
          Lightbulb: class {},
          Thermostat: class {}
        },
        Characteristic: {
          On: 'On',
          CurrentHeatingCoolingState: {
            OFF: 0,
            HEAT: 1
          },
          TargetHeatingCoolingState: {
            HEAT: 1
          },
          TargetTemperature: 'TargetTemperature',
          CurrentTemperature: 'CurrentTemperature'
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
            setProps: jest.fn().mockReturnThis(),
            onSet: jest.fn()
          })),
          updateCharacteristic: jest.fn()
        }))
      }) as unknown as PlatformAccessory),
      registerPlatformAccessories: jest.fn(),
      unregisterPlatformAccessories: jest.fn(),
      user: {
        persistPath: jest.fn(() => '/tmp')
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        channels: [{ channel_number: 1, mode: 1 }]
      })
    }) as any;

    platform = new ApiPlatform(
      log,
      {
        platform: 'ApiPlatform',
        apiKey: 'test-key',
        polling: {
          baseIntervalMs: 1000
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
    await Promise.resolve();
    expect(api.registerPlatformAccessories).toHaveBeenCalled();
  });

  it('removes accessory correctly', () => {
    platform.removeAccessory('channel-1');
    expect(api.unregisterPlatformAccessories).toHaveBeenCalled();
  });
});
