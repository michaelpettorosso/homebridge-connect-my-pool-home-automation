import { PollingController } from '../PollingController';

jest.useFakeTimers();

describe('PollingController', () => {
  let callback: jest.Mock<Promise<void>, []>;
  let controller: PollingController;
// src/__tests__/PollingController.test.ts
let log: any;

  beforeEach(() => {
    log = {
      info: jest.fn(),
      warn: jest.fn(),   // ✅ add this
      error: jest.fn(),
      debug: jest.fn(),
    };
    callback = jest.fn().mockResolvedValue(undefined);

    controller = new PollingController(
      log,
      100, // interval
      1000, // max interval
      2, // backoff multiplier
      20, // jitter
      callback
    );
    jest.useFakeTimers();

  });

  afterEach(() => {
    controller.stop();
    jest.clearAllTimers();
  });

  it('calls callback repeatedly at base interval', async () => {
    controller.start();

    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('increases interval and enables jitter on error', async () => {
    callback.mockRejectedValueOnce(new Error('fail'));
    controller.start();

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(controller['jitterEnabled']).toBe(true);
    expect(controller['intervalMs']).toBeGreaterThanOrEqual(100);
  });

  it('resets interval and disables jitter on success', async () => {
    controller.start();

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(controller['intervalMs']).toBe(100);
    expect(controller['jitterEnabled']).toBe(false);
  });
});
