import type { HolochainData, LoadingProgressUpdate } from './holochain';
import type { MainScreenRoute } from './launcher';

export const LOADING_PROGRESS_UPDATE = 'loading-progress-update';
export const MAIN_SCREEN_ROUTE = 'main-screen-route';
export const APP_INSTALLED = 'app-installed';
export const LAUNCHER_ERROR = 'launcher-error';
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
  [MAIN_SCREEN_ROUTE]: MainScreenRoute;
  [APP_INSTALLED]: HolochainData;
  [LAUNCHER_ERROR]: string;
  [LAIR_ERROR]: string;
  [LAIR_FATAL_PANIC]: string;
  [LAIR_LOG]: string;
  [LAIR_READY]: string;
  [HOLOCHAIN_ERROR]: HolochainData;
  [HOLOCHAIN_FATAL_PANIC]: HolochainData;
  [HOLOCHAIN_LOG]: HolochainData;
  [WASM_LOG]: HolochainData;
};
