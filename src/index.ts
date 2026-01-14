import { API } from 'homebridge';
import { ConnectMyPoolHomebridgePlatform } from './platform';
import {
  PLATFORM_NAME,
} from './settings';



export = (api: API) => {
  // TS workaround: cast to any
  (api as any).registerPlatform({
    id: PLATFORM_NAME,
    name: PLATFORM_NAME,
    platform: ConnectMyPoolHomebridgePlatform
  });
};
