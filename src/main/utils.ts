import type { AgentPubKeyB64 } from '@holochain/client';
import {
  type AppInfo,
  type CallZomeRequest,
  type CallZomeRequestSigned,
  getNonceExpiration,
  randomNonce,
} from '@holochain/client';
import { encode } from '@msgpack/msgpack';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import type { BrowserWindow } from 'electron';
import { shell } from 'electron';
import fs from 'fs';
import type {
  LauncherLairClient,
  ZomeCallNapi,
  ZomeCallUnsignedNapi,
} from 'hc-launcher-rust-utils';
import type * as rustUtils from 'hc-launcher-rust-utils';
import path from 'path';
import semver from 'semver';
import type { ZodSchema } from 'zod';

import { APP_STORE_APP_ID, DEVHUB_APP_ID, DISTRIBUTION_TYPE_DEFAULT_APP } from '$shared/const';
import { getErrorMessage } from '$shared/helpers';
import type { AppToInstall, DistributionInfoV1 } from '$shared/types';
import {
  type AdminWindow,
  APP_NAME_EXISTS_ERROR,
  DUPLICATE_PUBKEY_ERROR,
  type EventKeys,
  type EventMap,
  LOADING_PROGRESS_UPDATE,
  type WindowInfoRecord,
} from '$shared/types';

import { BREAKING_DEFAULT_HOLOCHAIN_VERSION } from './binaries';
import { APP_ALREADY_INSTALLED_ERROR, DUPLICATE_PUBKEY_ERROR_MESSAGE } from './const';
import type { LauncherFileSystem } from './filesystem';
import type { HolochainManager } from './holochainManager';
import type { LauncherEmitter } from './launcherEmitter';
import { DEFAULT_APPS_DIRECTORY } from './paths';

export function encodeQuery(query: Record<string, string>) {
  return Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export function setLinkOpenHandlers(browserWindow: BrowserWindow): void {
  // links in happ windows should open in the system default application
  // instead of the webview
  browserWindow.webContents.on('will-navigate', (e) => {
    console.log('GOT WILL-NAVIGATE EVENT: ', e);
    if (e.url.startsWith('http://localhost:5173')) {
      // ignore vite routing in dev mode
      return;
    }
    if (
      e.url.startsWith('http://') ||
      e.url.startsWith('https://') ||
      e.url.startsWith('mailto://')
    ) {
      e.preventDefault();
      shell.openExternal(e.url);
    }
  });

  // Links with target=_blank should open in the system default browser and
  // happ windows are not allowed to spawn new electron windows
  browserWindow.webContents.setWindowOpenHandler((details) => {
    console.log('GOT NEW WINDOW EVENT: ', details);
    if (details.url.startsWith('http://') || details.url.startsWith('https://')) {
      shell.openExternal(details.url);
    }
    return { action: 'deny' };
  });
}

export function throwTRPCErrorError({
  message,
  cause,
}: {
  message: string;
  cause?: unknown;
}): never {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message,
    cause,
  });
}

export const validateWithZod = <T>({
  schema,
  data,
  errorType,
}: {
  schema: ZodSchema<T>;
  data: unknown;
  errorType: string;
}): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return throwTRPCErrorError({
      message: errorType,
      cause: result.error,
    });
  }
  return result.data;
};

export const isDevhubInstalled = (
  HOLOCHAIN_MANAGERS: Record<string, HolochainManager>,
): boolean => {
  return HOLOCHAIN_MANAGERS[BREAKING_DEFAULT_HOLOCHAIN_VERSION].installedApps.some(
    (app) => app.installed_app_id === DEVHUB_APP_ID,
  );
};

export const processHeadlessAppInstallation =
  ({
    holochainManager,
    defaultAppsNetworkSeed,
    launcherEmitter,
  }: {
    holochainManager: HolochainManager;
    defaultAppsNetworkSeed: string;
    launcherEmitter: LauncherEmitter;
  }) =>
  async ({ id, name, progressUpdate }: AppToInstall): Promise<void> => {
    const isAppInstalled = holochainManager.installedApps.some(
      (app) => app.installed_app_id === id,
    );

    if (!isAppInstalled) {
      launcherEmitter.emit(LOADING_PROGRESS_UPDATE, progressUpdate);
      const happPath = path.join(DEFAULT_APPS_DIRECTORY, name);
      const happBytes = fs.readFileSync(happPath);
      await holochainManager.installHeadlessHappFromBytes({
        happBytes: Array.from(happBytes),
        appId: id,
        distributionInfo: { type: DISTRIBUTION_TYPE_DEFAULT_APP },
        networkSeed: defaultAppsNetworkSeed,
      });
    }
  };

export function happSessionName(holochainDataRootName: string, appId: string) {
  return `persist:${holochainDataRootName}#${appId}`;
}

export function breakingVersion(version: string) {
  if (!semver.valid(version)) {
    throw new Error('Version is not valid semver.');
  }

  const prerelease = semver.prerelease(version);
  if (prerelease) {
    return `${semver.major(version)}.${semver.minor(version)}.${semver.patch(version)}-${prerelease[0]}`;
  }

  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);

  return major === 0 ? (minor === 0 ? `0.0.${patch}` : `0.${minor}.x`) : `${major}.x.x`;
}

export async function signZomeCall(
  lairClient: LauncherLairClient,
  zomeCallUnsigned: CallZomeRequest,
): Promise<CallZomeRequestSigned> {
  const zomeCallUnsignedNapi: ZomeCallUnsignedNapi = {
    provenance: Array.from(zomeCallUnsigned.provenance),
    cellId: [Array.from(zomeCallUnsigned.cell_id[0]), Array.from(zomeCallUnsigned.cell_id[1])],
    zomeName: zomeCallUnsigned.zome_name,
    fnName: zomeCallUnsigned.fn_name,
    payload: Array.from(encode(zomeCallUnsigned.payload)),
    nonce: Array.from(await randomNonce()),
    expiresAt: getNonceExpiration(),
  };

  const zomeCallSignedNapi: ZomeCallNapi = await lairClient.signZomeCall(zomeCallUnsignedNapi);

  const zomeCallSigned: CallZomeRequestSigned = {
    provenance: Uint8Array.from(zomeCallSignedNapi.provenance),
    cap_secret: null,
    cell_id: [
      Uint8Array.from(zomeCallSignedNapi.cellId[0]),
      Uint8Array.from(zomeCallSignedNapi.cellId[1]),
    ],
    zome_name: zomeCallSignedNapi.zomeName,
    fn_name: zomeCallSignedNapi.fnName,
    payload: Uint8Array.from(zomeCallSignedNapi.payload),
    signature: Uint8Array.from(zomeCallSignedNapi.signature),
    expires_at: zomeCallSignedNapi.expiresAt,
    nonce: Uint8Array.from(zomeCallSignedNapi.nonce),
  };

  return zomeCallSigned;
}

export function createObservableGeneric<K extends EventKeys>(
  emitter: LauncherEmitter,
  eventName: K,
  withOff: boolean = true,
) {
  return observable<EventMap[K]>((emit) => {
    const handler = (data: EventMap[K]) => {
      emit.next(data);
    };

    emitter.on(eventName, handler);

    if (withOff) {
      return () => emitter.off(eventName, handler);
    }
    return;
  });
}

export const createAppInfo = (manager: HolochainManager) => (app: AppInfo) => {
  return {
    isHeadless: [DEVHUB_APP_ID, APP_STORE_APP_ID].includes(app.installed_app_id),
    appInfo: app,
    holochainDataRoot: manager.holochainDataRoot,
    icon: manager.appIcon(app.installed_app_id),
    distributionInfo: manager.appDistributionInfo(app.installed_app_id),
  };
};

export const getInstalledAppsInfo = (managers: Record<string, HolochainManager> = {}) => {
  return Object.values(managers).flatMap((manager) =>
    manager.installedApps.map(createAppInfo(manager)),
  );
};

export const installApp = async ({
  holochainManager,
  happAndUiBytes,
  appId,
  distributionInfo,
  networkSeed,
  icon,
  agentPubKey,
}: {
  holochainManager: HolochainManager;
  happAndUiBytes: rustUtils.HappAndUiBytes;
  appId: string;
  distributionInfo: DistributionInfoV1;
  networkSeed: string;
  icon?: Uint8Array;
  agentPubKey?: AgentPubKeyB64;
}): Promise<void> => {
  if (happAndUiBytes.uiBytes) {
    await holochainManager.installWebHappFromBytes({
      happAndUiBytes,
      appId,
      distributionInfo,
      networkSeed,
      icon,
      agentPubKey,
    });
  } else {
    await holochainManager.installHeadlessHappFromBytes({
      happBytes: happAndUiBytes.happBytes,
      appId,
      distributionInfo,
      networkSeed,
      agentPubKey,
    });
  }
};

export const handleInstallError = (error: unknown) => {
  const errorMessage = getErrorMessage(error);
  if (
    errorMessage.includes('AppAlreadyInstalled') ||
    errorMessage === APP_ALREADY_INSTALLED_ERROR
  ) {
    return throwTRPCErrorError({
      message: APP_NAME_EXISTS_ERROR,
      cause: errorMessage,
    });
  }
  if (errorMessage === DUPLICATE_PUBKEY_ERROR_MESSAGE) {
    return throwTRPCErrorError({
      message: DUPLICATE_PUBKEY_ERROR,
      cause: errorMessage,
    });
  }
  throw new Error(errorMessage);
};

export async function factoryResetUtility({
  launcherFileSystem,
  windowInfoMap,
  privilegedLauncherWindows,
  holochainManagers,
  lairHandle,
  app,
}: {
  launcherFileSystem: LauncherFileSystem;
  windowInfoMap: WindowInfoRecord;
  privilegedLauncherWindows?: Record<AdminWindow, BrowserWindow>;
  holochainManagers: Record<string, HolochainManager>;
  lairHandle?: ChildProcessWithoutNullStreams;
  app: Electron.App;
}) {
  if (!launcherFileSystem) {
    throw new Error('LauncherFilesystem is undefined. Aborting Factory Reset.');
  }

  console.log('Closing happ windows...');

  // 1. Close all windows to prevent chromium related files to be accessed by them
  Object.values(windowInfoMap).forEach((info) => {
    info.windowObject?.close();
  });

  console.log('Closing priviledged windows...');

  if (privilegedLauncherWindows) {
    Object.values(privilegedLauncherWindows).forEach((window) => {
      window?.close();
    });
  }

  console.log('Killing holochain...');

  // 2. Stop holochain and lair to prevent files being accessed by them
  Object.values(holochainManagers).forEach((manager) => {
    manager.processHandle?.kill();
  });

  console.log('Killing lair...');

  lairHandle?.kill();

  console.log('factory reset...');

  // 3. Remove all data
  await launcherFileSystem.factoryReset();

  // 4. Relaunch
  const options: Electron.RelaunchOptions = {
    args: process.argv,
  };
  // https://github.com/electron-userland/electron-builder/issues/1727#issuecomment-769896927
  if (process.env.APPIMAGE) {
    console.log('process.execPath: ', process.execPath);
    options.args!.unshift('--appimage-extract-and-run');
    options.execPath = process.env.APPIMAGE;
  }
  console.log('setting relaunch options...');

  app.relaunch(options);
  console.log('quit...');

  app.quit();
}

/**
 * Reads the value of a key in a yaml string. Only works for single-line values
 *
 * @param yamlString
 * @param key
 */
export function readYamlValue(yamlString: string, key: string) {
  const lines = yamlString.split('\n');
  const idx = lines.findIndex((line) => line.includes(`${key}:`));
  if (idx === -1) {
    return undefined;
  }
  const relevantLine = lines[idx];
  return relevantLine.replace(`${key}:`, '').trim();
}

/**
 * Replaces the value of a key in a yaml string with the specified new value. Only works for
 * single-line values
 *
 * This function is being used instead of something like the js-yaml package in order
 * to retain comments in the yaml file
 *
 * @param yamlString
 * @param key
 * @param newValue
 */
export function replaceYamlValue(yamlString: string, key: string, newValue: string) {
  const lines = yamlString.split('\n');
  const idx = lines.findIndex((line) => line.includes(`${key}:`));
  if (idx === -1) {
    throw Error(`Failed to set yaml value for key '${key}'. Key not found.`);
  }
  lines[idx] = `${key}: ${newValue}`;
  return lines.join('\n');
}
