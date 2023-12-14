export type HolochainVersion = string;

export type HolochainData = {
  version: HolochainVersion;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

export type LoadingProgressUpdate = 'Starting lair keystore...' | 'Starting Holochain...';
