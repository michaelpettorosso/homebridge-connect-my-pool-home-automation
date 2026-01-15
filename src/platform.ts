import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
//  Service,
//  Characteristic
} from 'homebridge';
import { AccessoryStore } from './AccessoryStore';
import { PollingController } from './PollingController';
import { RateLimiter } from './RateLimiter';
//import { ModeCharacteristic } from './ModeCharacteristic';

import {
  PlatformConfigExtended,
  RemoteAccessoryConfig,
  PoolConfigResponse,
  PoolStatusResponse
} from './types';

import {
  BASE_URL,
  DEFAULT_POLLING,
  DEFAULT_RATE_LIMIT
} from './settings';


export class ConnectMyPoolHomebridgePlatform implements DynamicPlatformPlugin {
//   public readonly Service: typeof Service; 
//   public readonly Characteristic: typeof Characteristic;  
  private readonly store: AccessoryStore;
  private readonly polling: PollingController;
  private readonly baseUrl: string;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfigExtended,
    public readonly api: API
  ) {

    this.baseUrl = config.baseUrl ?? BASE_URL;
    // this.Service = api.hap.Service;
    // this.Characteristic = api.hap.Characteristic;
    // // Cast Characteristic constructor to extended type
    // (this.Characteristic as unknown as { Mode?: typeof ModeCharacteristic }).Mode = ModeCharacteristic;

    // 🔹 Merge config with defaults
    const pollingConfig = {
      ...DEFAULT_POLLING,
      ...config.polling,
    };

    this.log.info('Polling config:', pollingConfig);
    const rateLimiter = new RateLimiter(config.rateLimit?.minIntervalMs ?? DEFAULT_RATE_LIMIT);
    this.store = new AccessoryStore(log, api, rateLimiter, config.apiKey!,  this.baseUrl);

    this.polling = new PollingController(
        log,
        pollingConfig.intervalMs,
        pollingConfig.maxIntervalMs,
        pollingConfig.backoffMultiplier,
        pollingConfig.jitterPercent,
        async () => {
            await this.pollPoolStatus();
        },
        this.api.user.persistPath() // 👈 persistent storage
        );

    this.polling.start();

     // 🔹 Load accessories dynamically from ConnectMyPool
    this.loadPoolConfig().catch(err =>
      this.log.error('Failed to load pool configuration', err)
    );

  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug(`Configuring cached accessory ${accessory.displayName}`);
    this.store.restore(accessory);
  }


  /**
   * Fetch /api/poolconfig and dynamically add accessories
   */
  private async loadPoolConfig(): Promise<void> {
  if (!this.config.apiKey) return;

  const response = await fetch(`${this.baseUrl}/poolconfig`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pool_api_code: this.config.apiKey }),
  });

  const data = (await response.json()) as PoolConfigResponse;

  const discoveredIds = new Set<string>();

  const add = (cfg: RemoteAccessoryConfig) => {
    discoveredIds.add(cfg.id);
    this.addAccessory(cfg);
  };
 
  if (data.has_heaters)
    data.heaters?.forEach((h: any) =>
        add({
            id: `heater-${h.heater_number}`,
            name: `Pool Heater`,
            type: 'heater',
            mode: h.mode === 1 ? 'on' : 'off',
        })
    );
  if (data.has_solar_systems)
    data.solar_systems?.forEach((s: any) =>
        add({
            id: `heater-${s.solar_number}`,
            name: `Solar Heater`,
            type: 'solar',
            mode: s.mode === 1 ? 'on' : 'off',
        })
    );

  if (data.has_lighting_zones)
    data.lighting_zones?.forEach((z: any) =>
        add({
        id: `light-${z.lighting_zone_number}`,
        name: `Pool Light ${z.lighting_zone_number}`,
        type: 'light',
        mode: z.mode === 1 ? 'on' : 'off',
        })
    );

  if (data.has_channels)
    data.channels?.forEach((c: any) =>
        add({
        id: `channel-${c.channel_number}`,
        name: `Channel ${c.channel_number}`,
        type: 'channel',
        mode: c.mode === 1 ? 'on' : 'off',
        })
    );

  if (data.has_valves)
    data.valves?.forEach((v: any) =>
        add({
        id: `valve-${v.valve_number}`,
        name: `Valve ${v.valve_number}`,
        type: 'valve',
        mode: v.mode === 1 ? 'on' : 'off',
        })
    );

  // 🔥 Remove stale accessories
  this.store.getAllIds().forEach(id => {
    if (!discoveredIds.has(id)) {
      this.removeAccessory(id);
    }
  });

  this.log.info('Accessory reconciliation complete');
}

  addAccessory(config: RemoteAccessoryConfig) {
    this.store.add(config);
  }

  removeAccessory(id: string) {
    this.store.remove(id);
  }

  async setAccessoryState(config: RemoteAccessoryConfig) {
    this.store.setState(config.id, config.mode);
    await this.store.setRemoteState(config);
  }

  private async pollPoolStatus(): Promise<void> {
  if (!this.config.apiKey) {
    return;
  }

  const response = await fetch(`${this.baseUrl}/poolstatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pool_api_code: this.config.apiKey }),
  });

  if (!response.ok) {
    throw new Error(`poolstatus failed: ${response.status}`);
  }

  const status = (await response.json()) as PoolStatusResponse;

  // Lighting zones
  status.lighting_zones?.forEach(zone => {
    this.store.setState(
      `light-${zone.lighting_zone_number}`,
      zone.mode === 1 ? 'on' : 'off'
    );
  });

  // Channels
  status.channels?.forEach(ch => {
    this.store.setState(
      `channel-${ch.channel_number}`,
      ch.mode === 1 ? 'on' : 'off'
    );
  });

  // Solar Heaters
  status.solar_systems?.forEach(s => {
    this.store.setState(
      `solar-${s.solar_number}`,
      s.mode === 1 ? 'on' : 'off'
    );
  });

  // Heaters
  status.heaters?.forEach(h => {
    this.store.setState(
      `heater-${h.heater_number}`,
      h.mode === 1 ? 'on' : 'off'
    );
  });

  // Valves
  status.valves?.forEach(v => {
    this.store.setState(
      `valve-${v.valve_number}`,
      v.mode === 1 ? 'on' : 'off'
    );
  });

  this.log.debug('Pool status updated');
}

}

