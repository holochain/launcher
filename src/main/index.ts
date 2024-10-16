import { optimizer } from '@electron-toolkit/utils';
import type { AppClient, CallZomeRequest, InstalledAppId } from '@holochain/client';
import { AppWebsocket } from '@holochain/client';
import { autoUpdater } from '@matthme/electron-updater';
import { decode } from '@msgpack/msgpack';
import { initTRPC } from '@trpc/server';
import { AppstoreAppClient, DevhubAppClient } from 'appstore-tools';
import { type ChildProcessWithoutNullStreams, spawnSync } from 'child_process';
import { Command, Option } from 'commander';
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { app, dialog, globalShortcut, ipcMain, Menu, protocol, shell } from 'electron';
import contextMenu from 'electron-context-menu';
import { createIPCHandler } from 'electron-trpc/main';
import fs from 'fs';
import type { LauncherLairClient } from 'hc-launcher-rust-utils';
import * as rustUtils from 'hc-launcher-rust-utils';
import path from 'path';
import semver from 'semver';
import z from 'zod';

import {
  ANIMATION_DURATION,
  APP_STORE_APP_ID,
  DEVHUB_APP_ID,
  DISTRIBUTION_TYPE_DEFAULT_APP,
  MAIN_WINDOW,
  MIN_HEIGHT,
  SETTINGS_WINDOW,
  WINDOW_SIZE,
} from '$shared/const';
import { getErrorMessage } from '$shared/helpers';
import type {
  AdminWindow,
  DistributionInfoV1,
  HolochainDataRoot,
  HolochainPartition,
  WindowInfoRecord,
} from '$shared/types';
import {
  AppVersionEntrySchemaWithIcon,
  BytesSchema,
  CHECK_INITIALIZED_KEYSTORE_ERROR,
  DOWNLOAD_PROGRESS_UPDATE,
  ExtendedAppInfoSchema,
  HIDE_SETTINGS_WINDOW,
  IncludeHeadlessSchema,
  InitializeAppPortsSchema,
  InstallDefaultAppSchema,
  InstallHappFromPathSchema,
  InstallHappOrWebhappFromBytesSchema,
  InstallWebhappFromHashesSchema,
  LAUNCHER_LOG,
  LOADING_PROGRESS_UPDATE,
  MISSING_BINARIES,
  NO_APP_PORT_ERROR,
  NO_APPSTORE_AUTHENTICATION_TOKEN_FOUND,
  NO_AVAILABLE_PEER_HOSTS_ERROR,
  NO_DEVHUB_AUTHENTICATION_TOKEN_FOUND,
  NO_DPKI_DEVICE_SEED_FOUND,
  NO_RUNNING_HOLOCHAIN_MANAGER_ERROR,
  REFETCH_DATA_IN_ALL_WINDOWS,
  REMOTE_CALL_TIMEOUT_ERROR,
  UpdateUiFromHashSchema,
  WRONG_INSTALLED_APP_STRUCTURE,
} from '$shared/types';

import { BREAKING_DEFAULT_HOLOCHAIN_VERSION, checkHolochainLairBinariesExist } from './binaries';
import { validateArgs } from './cli';
import { DEFAULT_APPS_TO_INSTALL, DEVHUB_INSTALL, DEVICE_SEED_LAIR_TAG } from './const';
import { LauncherFileSystem } from './filesystem';
import { HolochainManager } from './holochainManager';
import { IntegrityChecker } from './integrityChecker';
// import { AdminWebsocket } from '@holochain/client';
import { initializeLairKeystore, launchLairKeystore } from './lairKeystore';
import { LauncherEmitter } from './launcherEmitter';
import { setupLogs } from './logs';
import { exportLogs, launcherMenu, openLogs } from './menu';
import { DEFAULT_APPS_DIRECTORY } from './paths';
import {
  breakingVersion,
  createObservableGeneric,
  factoryResetUtility,
  getInstalledAppsInfo,
  handleInstallError,
  installApp,
  isDevhubInstalled,
  processHeadlessAppInstallation,
  signZomeCall,
  throwTRPCErrorError,
  validateWithZod,
} from './utils';
import { createHappWindow, loadOrServe, setupAppWindows } from './windows';

const t = initTRPC.create({ isServer: true });

const cli = new Command();

cli
  .name('Holochain Launcher')
  .description('Running Holochain Launcher via the command line.')
  .version(app.getVersion())
  .option(
    '-p, --profile <string>',
    'Runs the Launcher with a custom profile with its own dedicated data store.',
  )
  .option(
    '--holochain-path <string>',
    'Runs the Holochain Launcher with the holochain binary at the provided path. This creates an independent conductor from when running the Launcher with the built-in binary.',
  )
  .option(
    '--lair-binary-path <string>',
    "Runs the Holochain Launcher with the lair binary at the provided path. Make sure to use a lair binary that's compatible with the existing keystore.",
  )
  .option(
    '--use-default-partition',
    'If this flag is set together with the --holochain-path option, the default partition is used instead of a dedicated partition for custom holochain binaries',
  )
  .addOption(
    new Option(
      '--admin-port <number>',
      'If specified, the Launcher expectes an external holochain binary to run at this port. Requires the --lair-url and --apps-data-dir options to be specified as well.',
    ).argParser(parseInt),
  )
  .option(
    '--lair-url <string>',
    'URL of the lair keystore server associated to the externally running holochain binary.',
  )
  .option(
    '--apps-data-dir <string>',
    'Path where the Launcher can store app UI assets and other metadata when running an external holochain binary.',
  )
  .option(
    '-b, --bootstrap-url <url>',
    'URL of the bootstrap server to use. Is ignored if an external holochain binary is being used.',
  )
  .option(
    '-s, --signaling-url <url>',
    'URL of the signaling server to use. Is ignored if an external holochain binary is being used.',
  )
  .option(
    '--ice-urls <string>',
    'Comma separated string of ICE server URLs to use. Is ignored if an external holochain binary is being used.',
  )
  .option('--rust-log <string>', 'Set the RUST_LOG to be used.')
  .option('--wasm-log <string>', 'Set the WASM_LOG to be used.');

cli.parse();

console.log('GOT CLI ARGS: ', cli.opts());

const VALIDATED_CLI_ARGS = validateArgs(cli.opts());

console.log('VALIDATED CLI ARGS: ', VALIDATED_CLI_ARGS);

const appName = app.getName();

if (process.env.NODE_ENV === 'development') {
  console.log('APP IS RUN IN DEVELOPMENT MODE');
  app.setName(appName + '-dev');
}

contextMenu({
  showSaveImageAs: true,
  showSearchWithGoogle: false,
  showInspectElement: true,
  append: (_defaultActions, _parameters, browserWindow) => [
    {
      label: 'Reload',
      click: () => (browserWindow as BrowserWindow).reload(),
    },
    {
      label: 'Quit Launcher',
      click: () => app.quit(),
    },
  ],
});

console.log('APP PATH: ', app.getAppPath());
console.log('RUNNING ON PLATFORM: ', process.platform);

const isFirstInstance = app.requestSingleInstanceLock();

if (!isFirstInstance && app.isPackaged && !VALIDATED_CLI_ARGS.profile) {
  app.quit();
}

app.on('second-instance', () => {
  if (PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW]) {
    PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW].show();
  }
});

app.on('activate', () => {
  if (PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW]) {
    PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW].show();
  }
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'webhapp',
    privileges: { standard: true, secure: true, stream: true },
  },
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, stream: true },
  },
]);

const LAUNCHER_FILE_SYSTEM = LauncherFileSystem.connect(app, VALIDATED_CLI_ARGS.profile);
const LAUNCHER_EMITTER = new LauncherEmitter();

const DEFAULT_APPS_NETWORK_SEED = app.isPackaged
  ? `launcher-${breakingVersion(app.getVersion())}`
  : `launcher-dev-${breakingVersion(app.getVersion())}`;

setupLogs(LAUNCHER_EMITTER, LAUNCHER_FILE_SYSTEM);

let DEFAULT_LAIR_CLIENT: LauncherLairClient | undefined;
// Zome call signers for external binaries (admin ports used as keys)
const CUSTOM_LAIR_CLIENTS: Record<number, LauncherLairClient> = {};

let INTEGRITY_CHECKER: IntegrityChecker | undefined;

let APP_PORT: number | undefined;
// For now there is only one holochain data root at a time for the sake of simplicity.
let DEFAULT_HOLOCHAIN_DATA_ROOT: HolochainDataRoot | undefined;
const HOLOCHAIN_MANAGERS: Record<string, HolochainManager> = {}; // holochain managers sorted by HolochainDataRoot.name
let LAIR_HANDLE: ChildProcessWithoutNullStreams | undefined;
let LAIR_URL: string | undefined;
let PRIVILEGED_LAUNCHER_WINDOWS: Record<AdminWindow, BrowserWindow>; // Admin windows with special zome call signing priviledges
const WINDOW_INFO_MAP: WindowInfoRecord = {}; // WindowInfo by webContents.id - used to verify origin of zome call requests
let IS_LAUNCHED = false;
let IS_QUITTING = false;

const APP_CLIENTS: Record<InstalledAppId, AppClient> = {};
let APPSTORE_APP_CLIENT: AppstoreAppClient | undefined;
let DEVHUB_APP_CLIENT: DevhubAppClient | undefined;

Menu.setApplicationMenu(launcherMenu(LAUNCHER_FILE_SYSTEM));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
    // Default open or close DevTools by F12 in development and ignore CommandOrControl + R in production.
  });

  console.log('BEING RUN IN __dirnmane: ', __dirname);

  PRIVILEGED_LAUNCHER_WINDOWS = setupAppWindows(LAUNCHER_EMITTER);

  const mainWindow = PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW];
  const settingsWindow = PRIVILEGED_LAUNCHER_WINDOWS[SETTINGS_WINDOW];

  mainWindow.on('close', (e) => {
    if (IS_QUITTING) return;
    // If launcher has already launched, i.e. not "Enter Password" screen anymore, only hide the window
    if (IS_LAUNCHED) {
      e.preventDefault();
      mainWindow.hide();
      return;
    }
    // Close all windows to have the 'window-all-close' event be triggered
    settingsWindow.close();
  });

  settingsWindow.on('close', (e) => {
    if (IS_QUITTING || !IS_LAUNCHED) return;

    e.preventDefault();
    LAUNCHER_EMITTER.emit(HIDE_SETTINGS_WINDOW, true);
    settingsWindow.hide();
    setTimeout(() => {
      mainWindow.show();
    }, ANIMATION_DURATION);
  });

  // make sure window objects get deleted after closing
  Object.entries(PRIVILEGED_LAUNCHER_WINDOWS).forEach(([key, window]) => {
    window.on('closed', () => {
      delete PRIVILEGED_LAUNCHER_WINDOWS[key];
    });
  });

  createIPCHandler({ router, windows: Object.values(PRIVILEGED_LAUNCHER_WINDOWS) });

  ipcMain.handle('sign-zome-call', handleSignZomeCall);

  // Check for updates
  if (app.isPackaged) {
    autoUpdater.allowPrerelease = true;
    autoUpdater.autoDownload = false;

    const updateCheckResult = await autoUpdater.checkForUpdates();

    console.log('updateCheckResult: ', updateCheckResult);

    // We only install semver compatible updates
    const appVersion = app.getVersion();
    if (
      updateCheckResult &&
      breakingVersion(updateCheckResult.updateInfo.version) === breakingVersion(appVersion) &&
      semver.gt(updateCheckResult.updateInfo.version, appVersion)
    ) {
      const userDecision = await dialog.showMessageBox({
        title: 'Update Available',
        type: 'question',
        buttons: ['Deny', 'Install and Restart'],
        defaultId: 0,
        cancelId: 0,
        message: `A new compatible version of Launcher is available (${updateCheckResult.updateInfo.version}). Do you want to install it?`,
      });
      if (userDecision.response === 1) {
        // downloading means that with the next start of the application it's automatically going to be installed
        autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall());
        await autoUpdater.downloadUpdate();
      }
    }
  }
});

app.on('before-quit', () => {
  IS_QUITTING = true;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit();
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

app.on('quit', () => {
  if (LAIR_HANDLE) {
    LAIR_HANDLE.kill();
    LAIR_HANDLE = undefined;
  }
  Object.values(HOLOCHAIN_MANAGERS).forEach((manager) => {
    if (manager.processHandle) {
      manager.processHandle.kill();
    }
  });
});

/**
 *  ====================================================================================================================
 *  Utility Functions
 *  ====================================================================================================================
 */

const handleSignZomeCall = async (e: IpcMainInvokeEvent, request: CallZomeRequest) => {
  // TODO check here that cellId belongs to the installedAppId that the window belongs to
  const windowInfo = WINDOW_INFO_MAP[e.sender.id];
  let authorized = false;
  if (
    windowInfo &&
    request.provenance.toString() === Array.from(windowInfo.agentPubKey).toString()
  ) {
    authorized = true;
  } else {
    // Launcher admin windows get a wildcard to have any zome calls signed
    if (
      Object.values(PRIVILEGED_LAUNCHER_WINDOWS)
        .map((window) => window.webContents.id)
        .includes(e.sender.id)
    ) {
      authorized = true;
    }
  }

  if (!authorized) return Promise.reject('Agent public key unauthorized.');

  if (windowInfo && windowInfo.adminPort) {
    // In case of externally running binaries we need to use a custom zome call signer
    const lairClient = CUSTOM_LAIR_CLIENTS[windowInfo.adminPort];
    return signZomeCall(lairClient, request);
  }
  if (!DEFAULT_LAIR_CLIENT) throw Error('Lair signer is not ready');
  return signZomeCall(DEFAULT_LAIR_CLIENT, request);
};

// Kills any pre-existing lair processes and start up lair and assigns associated global variables
async function launchLairIfNecessary(password: string): Promise<void> {
  INTEGRITY_CHECKER = new IntegrityChecker(password);
  LAUNCHER_FILE_SYSTEM.setIntegrityChecker(INTEGRITY_CHECKER);
  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingLairKeystore');

  if (VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external') {
    LAIR_URL = VALIDATED_CLI_ARGS.holochainVersion.lairUrl;
    DEFAULT_LAIR_CLIENT = await rustUtils.LauncherLairClient.connect(LAIR_URL, password);
  } else if (!LAIR_HANDLE) {
    const [lairHandle, lairUrl2] = await launchLairKeystore(
      VALIDATED_CLI_ARGS.lairBinaryPath,
      LAUNCHER_FILE_SYSTEM.keystoreDir,
      LAUNCHER_EMITTER,
      password,
    );
    LAIR_URL = lairUrl2;
    DEFAULT_LAIR_CLIENT = await rustUtils.LauncherLairClient.connect(LAIR_URL, password);
    LAIR_HANDLE = lairHandle;
  }
}

/**
 *
 *
 * @param password  Password to encrypt conductor, lair and the automatically generated
 *                  root/device seeds and revocation keys
 */
async function handleQuickSetup(password: string): Promise<void> {
  if (!PRIVILEGED_LAUNCHER_WINDOWS) throw new Error('Main window needs to exist before launching.');
  const lairHandleTemp = spawnSync(VALIDATED_CLI_ARGS.lairBinaryPath, ['--version']);
  if (!lairHandleTemp.stdout) {
    console.error(`Failed to run lair-keystore binary:\n${lairHandleTemp}`);
  }
  console.log(`Got lair version ${lairHandleTemp.stdout.toString()}`);

  // 1. Check whether lair keystore is initialized, if not initialize
  if (!LAUNCHER_FILE_SYSTEM.keystoreInitialized()) {
    LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'initializingLairKeystore');
    await initializeLairKeystore(
      VALIDATED_CLI_ARGS.lairBinaryPath,
      LAUNCHER_FILE_SYSTEM.keystoreDir,
      LAUNCHER_EMITTER,
      password,
    );
  }

  // 2. Start up lair keystore process and connect to it
  await launchLairIfNecessary(password);

  // 3. Generate key recovery file and import device seed if necessary
  const dpkiDeviceSeedExists = await DEFAULT_LAIR_CLIENT!.seedExists(DEVICE_SEED_LAIR_TAG);
  if (!dpkiDeviceSeedExists) {
    LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'generatingKeyRecoveryFile');
    // 3.1. Generate KeyFile
    const keyFile = await rustUtils.generateInitialSeeds(password);
    // 3.2. Import device seed into lair
    LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'importingDeviceSeed');
    const importedSeedPubkey64 = await DEFAULT_LAIR_CLIENT!.importLockedSeedBundle(
      keyFile.deviceSeed0,
      password,
      DEVICE_SEED_LAIR_TAG,
    );
    // 3.3. Store to key recovery file on disk
    fs.writeFileSync(
      LAUNCHER_FILE_SYSTEM.keyRecoveryFilePath,
      JSON.stringify(keyFile, undefined, 2),
      'utf-8',
    );
    console.log('Imported device seed with pubkey: ', importedSeedPubkey64);
    LAUNCHER_EMITTER.emit(
      LAUNCHER_LOG,
      `Imported device seed with public key ${importedSeedPubkey64}`,
    );
  }
}

async function handleAdvancedSetup(
  password: string,
  lockedDeviceSeed: string,
  lockedSeedPassphrase: string,
) {
  const lairHandleTemp = spawnSync(VALIDATED_CLI_ARGS.lairBinaryPath, ['--version']);
  if (!lairHandleTemp.stdout) {
    console.error(`Failed to run lair-keystore binary:\n${lairHandleTemp}`);
  }
  console.log(`Got lair version ${lairHandleTemp.stdout.toString()}`);

  if (!LAUNCHER_FILE_SYSTEM.keystoreInitialized()) {
    LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'initializingLairKeystore');
    await initializeLairKeystore(
      VALIDATED_CLI_ARGS.lairBinaryPath,
      LAUNCHER_FILE_SYSTEM.keystoreDir,
      LAUNCHER_EMITTER,
      password,
    );
  }

  // 2. Start up lair keystore process and connect to it
  await launchLairIfNecessary(password);

  // 3. Make sure that there is no DPKI_DEVICE_SEED in lair yet
  const dpkiDeviceSeedExists = await DEFAULT_LAIR_CLIENT!.seedExists(DEVICE_SEED_LAIR_TAG);
  if (dpkiDeviceSeedExists)
    throw new Error('DPKI_DEVICE_SEED already exists in lair. Cannot import new device seed.');

  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'importingDeviceSeed');
  const importedSeedPubkey64 = await DEFAULT_LAIR_CLIENT!.importLockedSeedBundle(
    lockedDeviceSeed,
    lockedSeedPassphrase,
    DEVICE_SEED_LAIR_TAG,
  );

  console.log('Imported device seed with pubkey: ', importedSeedPubkey64);
  LAUNCHER_EMITTER.emit(
    LAUNCHER_LOG,
    `Imported device seed with public key ${importedSeedPubkey64}`,
  );
}

async function launchHolochain(password: string, lairUrl: string): Promise<void> {
  // Verify that the DPKI_DEVICE_SEED exists in lair at this point, otherwise throw an error
  // since otherwise the recovery key file will not actually be able to act as a recovery key file
  // as app keys won't be derived from the device seed
  if (VALIDATED_CLI_ARGS.holochainVersion.type !== 'running-external') {
    const dpkiDeviceSeedExists = await DEFAULT_LAIR_CLIENT!.seedExists(DEVICE_SEED_LAIR_TAG);
    if (!dpkiDeviceSeedExists)
      return throwTRPCErrorError({
        message: NO_DPKI_DEVICE_SEED_FOUND,
        cause: `No DPKI_DEVICE_SEED found in lair keystore. Cannot launch holochain without first importing a device seed into lair.'`,
      });
  }

  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingHolochain');

  if (!PRIVILEGED_LAUNCHER_WINDOWS) throw new Error('Main window needs to exist before launching.');

  const nonDefaultPartition: HolochainPartition =
    VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external'
      ? { type: 'external', name: 'unknown', path: VALIDATED_CLI_ARGS.holochainVersion.appsDataDir }
      : VALIDATED_CLI_ARGS.holochainVersion.type === 'custom-path' &&
          !VALIDATED_CLI_ARGS.useDefaultPartition
        ? { type: 'custom', name: 'unknown' }
        : { type: 'default' };

  console.log('VALIDATED_CLI_ARGS.holochainVersion: ', VALIDATED_CLI_ARGS.holochainVersion);

  const [holochainManager, holochainDataRoot] = await HolochainManager.launch(
    LAUNCHER_EMITTER,
    LAUNCHER_FILE_SYSTEM,
    INTEGRITY_CHECKER!,
    password,
    VALIDATED_CLI_ARGS.holochainVersion,
    lairUrl,
    VALIDATED_CLI_ARGS.bootstrapUrl,
    VALIDATED_CLI_ARGS.signalingUrl,
    VALIDATED_CLI_ARGS.iceUrls,
    VALIDATED_CLI_ARGS.rustLog,
    VALIDATED_CLI_ARGS.wasmLog,
    nonDefaultPartition,
  );
  DEFAULT_HOLOCHAIN_DATA_ROOT = holochainDataRoot;
  HOLOCHAIN_MANAGERS[holochainDataRoot.name] = holochainManager;
  APP_PORT = holochainManager.appPort;
  // Install default apps if necessary
  // TODO check sha256 hashes

  await Promise.all(
    DEFAULT_APPS_TO_INSTALL.map(
      processHeadlessAppInstallation({
        holochainManager,
        defaultAppsNetworkSeed: DEFAULT_APPS_NETWORK_SEED,
        launcherEmitter: LAUNCHER_EMITTER,
      }),
    ),
  );
}

const getHolochainManager = (dataRootName: string) => {
  const holochainManager = HOLOCHAIN_MANAGERS[dataRootName];
  if (!holochainManager) {
    return throwTRPCErrorError({
      message: NO_RUNNING_HOLOCHAIN_MANAGER_ERROR,
      cause: `No running Holochain Manager found for the specified partition: '${dataRootName}'`,
    });
  }
  return holochainManager;
};

const getAppClient = async (appId: InstalledAppId): Promise<AppClient> => {
  const defaultHolochainManager = HOLOCHAIN_MANAGERS[DEFAULT_HOLOCHAIN_DATA_ROOT!.name];
  let appClient = APP_CLIENTS[appId];
  if (appClient) return appClient;
  const token = await defaultHolochainManager.getAppToken(appId);
  appClient = await AppWebsocket.connect({
    url: new URL(`ws://localhost:${defaultHolochainManager.appPort}`),
    token,
    wsClientOptions: {
      origin: 'holochain-launcher',
    },
    callZomeTransform: {
      input: async (request) => signZomeCall(DEFAULT_LAIR_CLIENT!, request),
      output: (o) => decode(o),
    },
  });
  APP_CLIENTS[appId] = appClient;
  return appClient;
};

const getAppstoreAppClient = async () => {
  if (APPSTORE_APP_CLIENT) return APPSTORE_APP_CLIENT;
  if (!DEFAULT_HOLOCHAIN_DATA_ROOT) throw new Error('Default holochain data root is not defined.');
  const appClient = await getAppClient(APP_STORE_APP_ID);
  const appstoreAppClient = new AppstoreAppClient(appClient);
  APPSTORE_APP_CLIENT = appstoreAppClient;
  return APPSTORE_APP_CLIENT;
};

const getDevhubAppClient = async () => {
  if (DEVHUB_APP_CLIENT) return DEVHUB_APP_CLIENT;
  if (!DEFAULT_HOLOCHAIN_DATA_ROOT) throw new Error('Default holochain data root is not defined.');
  const appClient = await getAppClient(DEVHUB_APP_ID);
  const devhubAppClient = new DevhubAppClient(appClient);
  DEVHUB_APP_CLIENT = devhubAppClient;
  return DEVHUB_APP_CLIENT;
};

/**
 *  ====================================================================================================================
 *  IPC CALLS DEFINITIONS
 *  ====================================================================================================================
 */

const router = t.router({
  openSettings: t.procedure.mutation(() => {
    const mainWindow = PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW];
    const [xMain, yMain] = mainWindow.getPosition();
    const settingsWindow = PRIVILEGED_LAUNCHER_WINDOWS[SETTINGS_WINDOW];
    if (!settingsWindow) throw new Error('Settings window is undefined.');
    settingsWindow.setPosition(xMain + 50, yMain - 50);
    settingsWindow.show();
  }),
  hideApp: t.procedure.mutation(() => {
    PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW].hide();
  }),
  openApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);

    const windowInfo = Object.values(WINDOW_INFO_MAP).find(
      (info) =>
        info.installedAppId === appInfo.installed_app_id &&
        JSON.stringify(info.holochainDataRoot) === JSON.stringify(holochainDataRoot),
    );

    if (windowInfo) {
      windowInfo.windowObject.show();
      return;
    }

    const appAuthenticationToken = await holochainManager.getAppToken(appInfo.installed_app_id);

    const happWindow = createHappWindow(
      opts.input,
      LAUNCHER_FILE_SYSTEM,
      LAUNCHER_EMITTER,
      holochainManager.appPort,
      appAuthenticationToken,
    );

    const windowId = happWindow.webContents.id;

    WINDOW_INFO_MAP[windowId] = {
      installedAppId: appInfo.installed_app_id,
      holochainDataRoot,
      agentPubKey: appInfo.agent_pub_key,
      windowObject: happWindow,
      adminPort:
        VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external'
          ? VALIDATED_CLI_ARGS.holochainVersion.adminPort
          : undefined,
    };

    happWindow.on('closed', () => {
      if (happWindow) {
        delete WINDOW_INFO_MAP[windowId];
      }
    });
  }),
  uninstallApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);
    await holochainManager.uninstallApp(appInfo.installed_app_id);
  }),
  toggleApp: t.procedure
    .input(ExtendedAppInfoSchema.extend({ enable: z.boolean() }))
    .mutation(async (opts) => {
      const { appInfo, holochainDataRoot, enable } = opts.input;
      const holochainManager = getHolochainManager(holochainDataRoot.name);
      if (enable) {
        await holochainManager.enableApp(appInfo.installed_app_id);
      } else {
        await holochainManager.disableApp(appInfo.installed_app_id);
      }
    }),
  fetchWebhapp: t.procedure.input(AppVersionEntrySchemaWithIcon).mutation(async (opts) => {
    const { app_version, icon } = opts.input;
    const appVersionEntry = {
      ...app_version,
      metadata: app_version.metadata || {}, // Ensure metadata is defined if it's optional
    };
    const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
    const appstoreAppClient = await getAppstoreAppClient();

    const isUiAvailable = holochainManager.isUiAvailable(appVersionEntry.bundle_hashes.ui_hash);
    const isHappAvailable = holochainManager.isHappAvailableAndValid(
      appVersionEntry.bundle_hashes.happ_hash,
    );

    console.log('happAvailable, uiAvailable: ', isHappAvailable, isUiAvailable);

    if (isHappAvailable && isUiAvailable) return;

    try {
      if (!isHappAvailable) {
        console.log('fetching happ bytes...');
        const happBytes = await appstoreAppClient.fetchHappBytesInChunks(
          appVersionEntry,
          undefined,
          (status) => LAUNCHER_EMITTER.emit(DOWNLOAD_PROGRESS_UPDATE, status),
        );
        holochainManager.storeHapp(Array.from(happBytes));
        console.log('happ stored.');
      }
      if (!isUiAvailable) {
        console.log('fetching UI bytes...');
        const uiBytes = await appstoreAppClient.fetchUiBytesInChunks(
          appVersionEntry,
          undefined,
          (status) => LAUNCHER_EMITTER.emit(DOWNLOAD_PROGRESS_UPDATE, status),
        );
        holochainManager.storeUiIfNecessary(Array.from(uiBytes), icon);
        console.log('UI stored.');
      }
    } catch (error) {
      console.error(error);
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('No available peer host found.')) {
        return throwTRPCErrorError({
          message: NO_AVAILABLE_PEER_HOSTS_ERROR,
          cause: errorMessage,
        });
      }
      if (errorMessage.includes('Request timed out in 60000 ms: call_zome')) {
        return throwTRPCErrorError({
          message: REMOTE_CALL_TIMEOUT_ERROR,
          cause: errorMessage,
        });
      }
      throw new Error(errorMessage);
    }
  }),
  validateWebhappFormat: t.procedure.input(z.instanceof(Uint8Array)).mutation(async (opts) => {
    const decodedHappOrWebhapp = await rustUtils.decodeHappOrWebhapp(Array.from(opts.input));
    if (!decodedHappOrWebhapp.uiBytes) throw new Error('File is not a webhapp (no UI).');
    return true;
  }),
  isHappAvailableAndValid: t.procedure.input(z.string()).query(async (opts) => {
    const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.isHappAvailableAndValid(opts.input);
  }),
  areUiBytesAvailable: t.procedure.input(z.string()).query(async (opts) => {
    const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.isUiAvailable(opts.input);
  }),
  storeUiBytes: t.procedure.input(BytesSchema).mutation(async (opts) => {
    const { bytes } = opts.input;
    const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.storeUiIfNecessary(Array.from(bytes));
  }),
  storeHappBytes: t.procedure.input(BytesSchema).mutation(async (opts) => {
    const { bytes } = opts.input;
    const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.storeHapp(Array.from(bytes));
  }),
  installHappFromPath: t.procedure.input(InstallHappFromPathSchema).mutation(async (opts) => {
    try {
      const { filePath, appId, networkSeed, agentPubKey } = opts.input;
      const happAndUiBytes = await rustUtils.readAndDecodeHappOrWebhapp(filePath);
      const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
      const distributionInfo: DistributionInfoV1 = { type: 'filesystem' };
      await installApp({
        holochainManager: holochainManager,
        happAndUiBytes,
        appId,
        distributionInfo,
        networkSeed,
        agentPubKey,
      });
    } catch (error) {
      handleInstallError(error);
    }
  }),
  installWebhappFromHashes: t.procedure
    .input(InstallWebhappFromHashesSchema) // TODO: need metadata input as well here like name and action hash of app and app version in app store
    .mutation(async (opts) => {
      const { happSha256, uiZipSha256, appId, distributionInfo, networkSeed } = opts.input;
      try {
        const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
        await holochainManager.installWebhappFromHashes({
          happSha256,
          uiZipSha256,
          appId,
          distributionInfo,
          networkSeed,
        });
      } catch (error) {
        handleInstallError(error);
      }
    }),
  installWebhappFromBytes: t.procedure
    .input(InstallHappOrWebhappFromBytesSchema)
    .mutation(async (opts) => {
      const { bytes, appId, distributionInfo, networkSeed, icon, agentPubKey } = opts.input;
      const happAndUiBytes = await rustUtils.decodeHappOrWebhapp(Array.from(bytes));
      const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
      await installApp({
        holochainManager,
        happAndUiBytes,
        appId,
        distributionInfo,
        networkSeed,
        icon,
        agentPubKey,
      });
    }),
  installDefaultApp: t.procedure.input(InstallDefaultAppSchema).mutation(async (opts) => {
    try {
      const { name, appId, networkSeed, agentPubKey } = opts.input;
      const filePath = path.join(DEFAULT_APPS_DIRECTORY, name);
      const happAndUiBytes = await rustUtils.readAndDecodeHappOrWebhapp(filePath);
      const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
      await installApp({
        holochainManager,
        happAndUiBytes,
        appId,
        distributionInfo: { type: DISTRIBUTION_TYPE_DEFAULT_APP },
        networkSeed,
        agentPubKey,
      });
    } catch (error) {
      handleInstallError(error);
    }
  }),
  updateUiFromHash: t.procedure.input(UpdateUiFromHashSchema).mutation((opts) => {
    const { uiZipSha256, appId, appVersionActionHash } = opts.input;
    const holochainManager = getHolochainManager(DEFAULT_HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.updateUiFromHash(uiZipSha256, appId, appVersionActionHash);
  }),
  getKandoBytes: t.procedure.query(async () => {
    const filePath = path.join(DEFAULT_APPS_DIRECTORY, 'kando.webhapp');
    const kandoBytesBuffer = fs.readFileSync(filePath);
    return new Uint8Array(kandoBytesBuffer);
  }),
  lairSetupRequired: t.procedure.query(() => {
    const holochainLairBinariesExist = checkHolochainLairBinariesExist();

    if (!holochainLairBinariesExist) {
      return throwTRPCErrorError({
        message: MISSING_BINARIES,
      });
    }

    const isInitialized =
      LAUNCHER_FILE_SYSTEM.keystoreInitialized() ||
      VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external';

    const isInitializedValidated = validateWithZod({
      schema: z.boolean(),
      data: isInitialized,
      errorType: CHECK_INITIALIZED_KEYSTORE_ERROR,
    });

    return !isInitializedValidated;
  }),
  dpkiDeviceSeedPresent: t.procedure
    .input(z.object({ password: z.string() }))
    .mutation(async (opts) => {
      const password = opts.input.password;
      if (!DEFAULT_LAIR_CLIENT || !LAIR_URL || !LAIR_HANDLE) {
        await launchLairIfNecessary(password);
      }
      return DEFAULT_LAIR_CLIENT!.seedExists(DEVICE_SEED_LAIR_TAG);
    }),
  getHolochainStorageInfo: t.procedure.query(() => {
    const defaultHolochainManager = HOLOCHAIN_MANAGERS[BREAKING_DEFAULT_HOLOCHAIN_VERSION];
    const holochainDataRoot = defaultHolochainManager.holochainDataRoot;
    // TODO if required, return storage info for all Holochain versions if there ever are multiple
    return LAUNCHER_FILE_SYSTEM.getHolochainStorageInfo(holochainDataRoot);
  }),
  defaultHolochainVersion: t.procedure.query(
    () => HOLOCHAIN_MANAGERS[BREAKING_DEFAULT_HOLOCHAIN_VERSION].version,
  ),
  getLauncherVersion: t.procedure.query(() => app.getVersion()),
  isDevhubInstalled: t.procedure.query(() => isDevhubInstalled(HOLOCHAIN_MANAGERS)),
  getInstalledApps: t.procedure.input(IncludeHeadlessSchema).query((opts) => {
    const { input: includeHeadless } = opts;
    const installedApps = getInstalledAppsInfo(HOLOCHAIN_MANAGERS);

    const processApps = (apps: typeof installedApps, includeHeadless: boolean) => {
      const sortedApps = apps.sort((a, b) =>
        a.isHeadless === b.isHeadless ? 0 : a.isHeadless ? -1 : 1,
      );
      return includeHeadless ? sortedApps : sortedApps.filter(({ isHeadless }) => !isHeadless);
    };

    return validateWithZod({
      schema: z.array(ExtendedAppInfoSchema),
      data: processApps(installedApps, includeHeadless),
      errorType: WRONG_INSTALLED_APP_STRUCTURE,
    });
  }),
  // Generate key recovery file and ask for export location (Advanced Setup)
  generateAndExportKeyRecoveryFile: t.procedure
    .input(z.string())
    .mutation(async (opts): Promise<rustUtils.KeyFile> => {
      // 1. Generate keys
      const keyFile = await rustUtils.generateInitialSeeds(opts.input);
      // 2. Export them to a file
      const exportToPathResponse = await dialog.showSaveDialog({
        title: 'Export Key Recovery File',
        buttonLabel: 'Export',
        defaultPath: `Holochain_Launcher_${app.getVersion()}_Key_Recovery_File_${new Date().toISOString()}.json`,
      });
      if (!exportToPathResponse.filePath) throw new Error('File path undefined.');
      fs.writeFileSync(
        exportToPathResponse.filePath,
        JSON.stringify(keyFile, undefined, 2),
        'utf-8',
      );
      shell.showItemInFolder(exportToPathResponse.filePath);
      return keyFile;
    }),
  quickSetup: t.procedure.input(z.object({ password: z.string() })).mutation((opts) => {
    return handleQuickSetup(opts.input.password);
  }),
  // Set up lair with a provided device seed that has been previously generated and exported
  // (kwy recovery file not stored by launcher)
  advancedSetup: t.procedure
    .input(
      z.object({
        password: z.string(),
        lockedDeviceSeed: z.string(),
        lockedSeedPassphrase: z.string(),
      }),
    )
    .mutation((opts) => {
      const { password, lockedDeviceSeed, lockedSeedPassphrase } = opts.input;
      return handleAdvancedSetup(password, lockedDeviceSeed, lockedSeedPassphrase);
    }),
  launch: t.procedure.input(z.object({ password: z.string() })).mutation(async (opts) => {
    const password = opts.input.password;
    if (!PRIVILEGED_LAUNCHER_WINDOWS)
      throw new Error('Main window needs to exist before launching.');
    if (!DEFAULT_LAIR_CLIENT || !LAIR_URL || !LAIR_HANDLE) {
      await launchLairIfNecessary(password);
    }
    await launchHolochain(password, LAIR_URL!);
    IS_LAUNCHED = true;
    PRIVILEGED_LAUNCHER_WINDOWS[MAIN_WINDOW].setSize(WINDOW_SIZE, MIN_HEIGHT, true);
    loadOrServe(PRIVILEGED_LAUNCHER_WINDOWS[SETTINGS_WINDOW], { screen: SETTINGS_WINDOW });
  }),
  initializeDefaultAppPorts: t.procedure.query(async () => {
    const defaultHolochainManager = HOLOCHAIN_MANAGERS[DEFAULT_HOLOCHAIN_DATA_ROOT!.name];

    const getTokenOrThrow = async (appId: string, errorMessage: string) => {
      const token = await defaultHolochainManager.getAppToken(appId);
      if (!token) {
        throwTRPCErrorError({ message: errorMessage });
      }
      return token;
    };

    const appstoreAuthenticationToken = await getTokenOrThrow(
      APP_STORE_APP_ID,
      NO_APPSTORE_AUTHENTICATION_TOKEN_FOUND,
    );
    const devhubAuthenticationToken = isDevhubInstalled(HOLOCHAIN_MANAGERS)
      ? await getTokenOrThrow(DEVHUB_APP_ID, NO_DEVHUB_AUTHENTICATION_TOKEN_FOUND)
      : undefined;

    return validateWithZod({
      schema: InitializeAppPortsSchema,
      data: {
        appPort: APP_PORT,
        appstoreAuthenticationToken,
        devhubAuthenticationToken,
      },
      errorType: NO_APP_PORT_ERROR,
    });
  }),
  installDevhub: t.procedure.mutation(async () => {
    const defaultHolochainManager = HOLOCHAIN_MANAGERS[BREAKING_DEFAULT_HOLOCHAIN_VERSION];
    await processHeadlessAppInstallation({
      holochainManager: defaultHolochainManager,
      defaultAppsNetworkSeed: DEFAULT_APPS_NETWORK_SEED,
      launcherEmitter: LAUNCHER_EMITTER,
    })(DEVHUB_INSTALL);

    const authenticationToken = await defaultHolochainManager.getAppToken(DEVHUB_APP_ID);

    // make a whoami zome call to all relevant zomes to trigger init to register
    // yourself as a host for the relevant functions in portal
    const devhubClient = await getDevhubAppClient();
    await devhubClient.appHubZomeClient.whoami();
    await devhubClient.dnaHubZomeClient.whoami();
    await devhubClient.zomeHubZomeClient.whoami();
    await devhubClient.portalZomeClient.whoami();

    return {
      appPort: APP_PORT,
      authenticationToken,
    };
  }),
  onSetupProgressUpdate: t.procedure.subscription(() => {
    return createObservableGeneric(LAUNCHER_EMITTER, LOADING_PROGRESS_UPDATE);
  }),
  onDownloadProgressUpdate: t.procedure.subscription(() => {
    return createObservableGeneric(LAUNCHER_EMITTER, DOWNLOAD_PROGRESS_UPDATE);
  }),
  deriveAndImportSeedFromJsonFile: t.procedure
    .input(z.object({ filePath: z.string(), passphrase: z.string().optional() }))
    .mutation(async (opts) => {
      if (!DEFAULT_LAIR_CLIENT) throw new Error('Lair client is not ready.');
      return DEFAULT_LAIR_CLIENT.deriveAndImportSeedFromJsonFile(
        opts.input.filePath,
        opts.input.passphrase,
      );
    }),
  hideSettingsWindow: t.procedure.subscription(() => {
    return createObservableGeneric(LAUNCHER_EMITTER, HIDE_SETTINGS_WINDOW, false);
  }),
  refetchDataSubscription: t.procedure.subscription(() => {
    return createObservableGeneric(LAUNCHER_EMITTER, REFETCH_DATA_IN_ALL_WINDOWS, false);
  }),
  factoryReset: t.procedure.mutation(() =>
    factoryResetUtility({
      launcherFileSystem: LAUNCHER_FILE_SYSTEM,
      windowInfoMap: WINDOW_INFO_MAP,
      privilegedLauncherWindows: PRIVILEGED_LAUNCHER_WINDOWS,
      holochainManagers: HOLOCHAIN_MANAGERS,
      lairHandle: LAIR_HANDLE,
      app,
    }),
  ),
  openLogs: t.procedure.mutation(async () => {
    await openLogs(LAUNCHER_FILE_SYSTEM);
  }),
  exportLogs: t.procedure.mutation(async () => {
    await exportLogs(LAUNCHER_FILE_SYSTEM);
  }),
});

export type AppRouter = typeof router;
