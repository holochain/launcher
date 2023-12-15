import { AppInfo } from '@holochain/client';

export type HolochainData = {
  version: HolochainVersion;
  partition: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

export interface ExtendedAppInfo {
  appInfo: AppInfo;
  version: HolochainVersion;
  partition: string;
}

export type HolochainVersion =
  | {
      // holochain binary that has been shipped with the launcher
      type: 'built-in';
      version: string;
    }
  | {
      // Custom holochain binary from a path
      type: 'custom-path';
      path: string;
    }
  | {
      // Externally running holochain binary. E.g. started via a terminal.
      type: 'running-external';
    };

export interface RunningHolochain {
  version: HolochainVersion;
  partition: string;
  appPort: number;
}

export type LoadingProgressUpdate = 'Starting lair keystore...' | 'Starting Holochain...';
