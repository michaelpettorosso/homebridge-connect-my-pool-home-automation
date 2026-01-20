import { AccessoryStore } from '../src/AccessoryStore';
import { RateLimiter } from '../src/RateLimiter';
import { LightAccessoryConfig } from '../src/types/accessory';
import { mockAccessory, mockAPI } from './mocks/homebridge';

const log = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const rateLimiter: RateLimiter = {
  schedule: async (fn: any) => fn(),
} as any;

const baseConfig = {
  id: 'light-1',
  name: 'Pool Light',
  type: 'light',
};

describe('AccessoryStore', () => {
  let store: AccessoryStore;

  beforeEach(() => {
    store = new AccessoryStore(
      log as any,
      mockAPI as any,
      rateLimiter,
      'API_KEY',
      'https://example.com',
    );
  });

  test('adds and registers accessory', () => {
    const accessory = store.add(baseConfig as LightAccessoryConfig);

    expect(mockAPI.registerPlatformAccessories).toHaveBeenCalled();
    expect(store.getAccessory('light-1')).toBe(accessory);
  });

  test('restores accessory', () => {
    const acc = mockAccessory('light-1') as any;
    acc.context = { id: 'light-1', mode: 'on' };

    store.restore(acc);

    expect(store.getState('light-1')).toBe('on');
  });

  test('removes accessory', () => {
    store.add(baseConfig as LightAccessoryConfig);
    store.remove('light-1');

    expect(mockAPI.unregisterPlatformAccessories).toHaveBeenCalled();
    expect(store.getAccessory('light-1')).toBeUndefined();
  });

  test('tracks accessory state', () => {
    store.setState('light-1', { mode: 'on' } as any);

    expect(store.getState('light-1')).toEqual({ mode: 'on' });
  });

  test('sends remote state update', async () => {
    await store.setRemoteState(baseConfig as any, { mode: 'on' } as any);

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/poolaction',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('creates heater with weather service', () => {
    const heaterConfig = {
      id: 'heater-1',
      name: 'Pool Heater',
      type: 'heater',
      solarId: 1,
      solarConfig: {
        weatherApiKey: 'WEATHER_KEY',
      },
    };

    const accessory = store.add(heaterConfig as any);

    expect(accessory).toBeDefined();
  });

  test('getAllIds returns all accessories', () => {
    store.add(baseConfig as LightAccessoryConfig);
    store.add({ ...(baseConfig as LightAccessoryConfig), id: 'light-2' });

    expect(store.getAllIds()).toEqual(['light-1', 'light-2']);
  });
});
