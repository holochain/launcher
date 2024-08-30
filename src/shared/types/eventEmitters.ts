import type { HolochainData, LoadingProgressUpdate } from './holochain';

export const LOADING_PROGRESS_UPDATE = 'loading-progress-update';
export const REFETCH_DATA_IN_ALL_WINDOWS = 'refetch-data-in-all-windows';
export const APP_INSTALLED = 'app-installed';
export const HIDE_SETTINGS_WINDOW = 'hide-settings-window';
export const LAUNCHER_ERROR = 'launcher-error';
export const LAUNCHER_LOG = 'launcher-log';
export const LAIR_ERROR = 'lair-error';
export const LAIR_FATAL_PANIC = 'lair-fatal-panic';
export const LAIR_LOG = 'lair-log';
export const LAIR_READY = 'lair-ready';
export const HOLOCHAIN_ERROR = 'holochain-error';
export const HOLOCHAIN_FATAL_PANIC = 'holochain-fatal-panic';
export const HOLOCHAIN_LOG = 'holochain-log';
export const WASM_LOG = 'wasm-log';

export type EventMap = {
  [LOADING_PROGRESS_UPDATE]: LoadingProgressUpdate;
  [APP_INSTALLED]: HolochainData;
  [LAUNCHER_ERROR]: string;
  [LAUNCHER_LOG]: string;
  [HIDE_SETTINGS_WINDOW]: boolean;
  [LAIR_ERROR]: string;
  [LAIR_FATAL_PANIC]: string;
  [LAIR_LOG]: string;
  [LAIR_READY]: string;
  [REFETCH_DATA_IN_ALL_WINDOWS]: string;
  [HOLOCHAIN_ERROR]: HolochainData;
  [HOLOCHAIN_FATAL_PANIC]: HolochainData;
  [HOLOCHAIN_LOG]: HolochainData;
  [WASM_LOG]: HolochainData;
};

export type EventKeys = keyof EventMap;
