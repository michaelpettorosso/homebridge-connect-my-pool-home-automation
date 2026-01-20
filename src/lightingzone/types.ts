import { PoolAction } from '../types/api'

export type LightingZoneMode = 'off' | 'auto' | 'on' ;

export interface LightingZoneAccessoryContext {
  name: string;
  id: number;
  colourEnabled: boolean;
  coloursAvaliable: [Record<string, ColorAvailable>];
}

export interface LightingZoneState {
  mode: LightingZoneMode;
  colour?: ColorAvailable;
}

export interface LightingZoneRuntimeState {
  mode: LightingZoneMode;
  colour?: ColorAvailable;
}

export interface LightingZoneModeBody {
  pool_api_code: string;
  action_code: PoolAction.SetLightingZoneMode;
  device_number: number;
  value: number;
}


//SLX Astral
// export enum ColorAvailable {
//     Red = 1,
//     Orange = 2,
//     Green = 4,
//     Blue = 5,
//     White = 7,
//     User1 = 8,
//     Disco = 10,
//     Magenta = 13,
//     Cyan = 14,
//     Pattern = 15,
//     Rainbow = 16,
//     Ocean = 17,
// }

export enum ColorAvailable {
    Red = 1,
    Orange = 2,
    Yellow = 3,
    Green = 4,
    Blue = 5,
    Purple = 6,
    White = 7,
    User1 = 8,
    User2 = 9,
    Disco = 10,
    Smooth = 11,
    Fade = 12,
    Magenta = 13,
    Cyan = 14,
    Pattern = 15,
    Rainbow = 16,
    Ocean = 17,
    VoodooLounge = 18,
    DeepBlueSea = 19,
    RoyalBlue = 20,
    AfternoonSkies = 21,
    AquaGreen = 22,
    Emerald = 23,
    WarmRed = 24,
    Flamingo = 25,
    VividViolet = 26,
    Sangria = 27,
    Twilight = 28,
    Tranquillity = 29,
    Gemstone = 30,
    USA = 31,
    MardiGras = 32,
    CoolCabaret = 33,
    Sam = 34,
    PartyRomance = 36,
    Caribbean = 37,
    American = 38,
    CaliforniaSunset = 39,
    Royal = 40,
    Hold = 41,
    Recall = 42,
    PeruvianParadise = 43,
    SuperNova = 44,
    NorthernLights = 45,
    TidalWave = 46,
    PatriotDream = 47,
    DesertSkies = 48,
    Nova = 49,
    Pink = 50
}
