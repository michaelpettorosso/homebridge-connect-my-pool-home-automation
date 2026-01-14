export class RateLimiter {
  private lastCall = 0;

  constructor(private readonly minIntervalMs: number) {}

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, this.minIntervalMs - (now - this.lastCall));

    if (wait > 0) await new Promise(res => setTimeout(res, wait));

    this.lastCall = Date.now();
    return fn();
  }
}
