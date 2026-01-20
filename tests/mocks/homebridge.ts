export const mockCharacteristic = {
  onGet: jest.fn().mockReturnThis(),
  onSet: jest.fn().mockReturnThis(),
  setProps: jest.fn().mockReturnThis(),
};

export const mockService = {
  getCharacteristic: jest.fn(() => mockCharacteristic),
};

export const mockAccessory = (id: string) => ({
  context: { id },
  getService: jest.fn(() => null),
  addService: jest.fn(() => mockService),
});

export const mockAPI = {
  hap: {
    uuid: { generate: jest.fn(id => id) },
    Service: {
      Switch: 'Switch',
      Lightbulb: 'Lightbulb',
      Thermostat: 'Thermostat',
    },
    Characteristic: {
      Mode: 'Mode',
    },
  },
  platformAccessory: jest.fn((name, uuid) => mockAccessory(uuid)),
  registerPlatformAccessories: jest.fn(),
  unregisterPlatformAccessories: jest.fn(),
};
