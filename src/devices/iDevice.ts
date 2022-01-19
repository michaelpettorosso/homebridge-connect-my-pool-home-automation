import { Categories } from 'homebridge';

export interface IDevice {
    //readonly name: string;
    readonly deviceName: string;
    readonly deviceType: string;
    readonly deviceTypeNumber: number;
    readonly category: Categories | undefined;
    readonly data;
}