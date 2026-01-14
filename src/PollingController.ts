import fs from 'fs';
import path from 'path';
import { Logger } from 'homebridge';

interface PollingState {
  intervalMs: number;
  jitterEnabled: boolean;
  lastErrorAt?: number;
}

export class PollingController {
  private intervalMs: number;
  private jitterEnabled = false;
  private timer?: NodeJS.Timeout;
  private readonly stateFile: string;

  constructor(
    private readonly log: Logger,
    private readonly baseIntervalMs: number,
    private readonly maxIntervalMs: number,
    private readonly backoffMultiplier: number,
    private readonly jitterFraction: number,
    private readonly pollFn: () => Promise<void>,
    persistDir?: string
  ) {
    this.intervalMs = baseIntervalMs;
    this.stateFile = persistDir
      ? path.join(persistDir, 'connectmypool-polling.json')
      : '';

    this.restoreState();
  }

  private restoreState() {
    if (!this.stateFile || !fs.existsSync(this.stateFile)) return;

    try {
      const raw = fs.readFileSync(this.stateFile, 'utf8');
      const state = JSON.parse(raw) as PollingState;

      this.intervalMs = state.intervalMs ?? this.baseIntervalMs;
      this.jitterEnabled = state.jitterEnabled ?? false;

      this.log.info(
        `Restored polling state (interval=${this.intervalMs}ms, jitter=${this.jitterEnabled})`
      );
    } catch (e) {
      this.log.warn('Failed to restore polling state, starting fresh');
    }
  }

  private persistState() {
    if (!this.stateFile) return;

    const state: PollingState = {
      intervalMs: this.intervalMs,
      jitterEnabled: this.jitterEnabled,
    };

    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(state));
    } catch (e) {
      this.log.warn('Failed to persist polling state');
    }
  }

  start() {
    this.scheduleNext();
  }

  private scheduleNext() {
    const jitter = this.jitterEnabled
      ? this.intervalMs * this.jitterFraction * Math.random()
      : 0;

    this.timer = setTimeout(async () => {
      try {
        await this.pollFn();
        this.onSuccess();
      } catch (err) {
        this.onError(err);
      } finally {
        this.scheduleNext();
      }
    }, this.intervalMs + jitter);

    this.timer.unref(); // 🔑 prevents Jest & shutdown hangs
  }

  private onSuccess() {
    this.intervalMs = this.baseIntervalMs;
    this.jitterEnabled = false;
    this.persistState();
  }

  private onError(err: unknown) {
    this.log.warn('Polling error, backing off', err as Error);

    this.intervalMs = Math.min(
      this.intervalMs * this.backoffMultiplier,
      this.maxIntervalMs
    );

    this.jitterEnabled = true;
    this.persistState();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
  }
}
