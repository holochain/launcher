import type { CallZomeRequestSigned } from '@holochain/client';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { BrowserWindow } from 'electron';
import { shell } from 'electron';
import fs from 'fs';
import type { ZomeCallNapi, ZomeCallSigner, ZomeCallUnsignedNapi } from 'hc-launcher-rust-utils';
import path from 'path';
import semver from 'semver';
import type { ZodSchema } from 'zod';

import { DEVHUB_APP_ID } from '$shared/const';
import type { AppToInstall } from '$shared/types';
import {
  type EventKeys,
  type EventMap,
  LOADING_PROGRESS_UPDATE,
  type WindowInfoRecord,
} from '$shared/types';

import { DEFAULT_HOLOCHAIN_VERSION } from './binaries';
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
  return HOLOCHAIN_MANAGERS[DEFAULT_HOLOCHAIN_VERSION].installedApps.some(
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
      await holochainManager.installHeadlessHappFromBytes(
        Array.from(happBytes),
        id,
        { type: 'default-app' },
        defaultAppsNetworkSeed,
      );
    }
  };

export function isHappAlreadyOpened({
  installed_app_id,
  WINDOW_INFO_MAP,
}: {
  installed_app_id: string;
  WINDOW_INFO_MAP: WindowInfoRecord;
}) {
  const windowEntry = Object.entries(WINDOW_INFO_MAP).find(
    ([, value]) => value.installedAppId === installed_app_id,
  );
  if (!windowEntry) return false;

  const [windowId] = windowEntry;
  const window = BrowserWindow.fromId(parseInt(windowId));
  if (!window) return false;

  if (window.isMinimized()) window.restore();
  window.focus();

  return true;
}

export function breakingVersion(version: string) {
  if (!semver.valid(version)) {
    throw new Error('Version is not valid semver.');
  }

  if (semver.prerelease(version)) {
    return version;
  }

  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);

  return major === 0 ? (minor === 0 ? `0.0.${patch}` : `0.${minor}.x`) : `${major}.x.x`;
}

export async function signZomeCall(
  zomeCallSigner: ZomeCallSigner,
  zomeCallUnsigned: ZomeCallUnsignedNapi,
): Promise<CallZomeRequestSigned> {
  const zomeCallSignedNapi: ZomeCallNapi = await zomeCallSigner.signZomeCall(zomeCallUnsigned);

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

export function createObservable<K extends EventKeys>(
  emitter: LauncherEmitter,
  eventName: K,
  singleEmission: boolean = false,
) {
  return observable<EventMap[K]>((emit) => {
    const handler = (data: EventMap[K]) => {
      emit.next(data);
      if (singleEmission) {
        emitter.off(eventName, handler);
      }
    };

    emitter.on(eventName, handler);

    return !singleEmission ? () => emitter.off(eventName, handler) : undefined;
  });
}
