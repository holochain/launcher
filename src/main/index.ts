import { optimizer } from '@electron-toolkit/utils';
import type { AppClient, CallZomeRequest, InstalledAppId } from '@holochain/client';
import { AppWebsocket } from '@holochain/client';
import { autoUpdater } from '@matthme/electron-updater';
import { decode } from '@msgpack/msgpack';
import { initTRPC } from '@trpc/server';
import { AppstoreAppClient, DevhubAppClient, webhappToHappAndUi } from 'appstore-tools';
import { type ChildProcessWithoutNullStreams, spawnSync } from 'child_process';
import { Command, Option } from 'commander';
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { app, dialog, ipcMain, Menu, protocol } from 'electron';
import contextMenu from 'electron-context-menu';
import { createIPCHandler } from 'electron-trpc/main';
import fs from 'fs';
import type { LauncherLairClient } from 'hc-launcher-rust-utils';
import * as rustUtils from 'hc-launcher-rust-utils';
import path from 'path';
import semver from 'semver';
import z from 'zod';

import {
  APP_STORE_APP_ID,
  DEVHUB_APP_ID,
  DISTRIBUTION_TYPE_DEFAULT_APP,
  MAIN_SCREEN,
  MIN_HEIGH,
  SETTINGS_SCREEN,
  WINDOW_SIZE,
} from '$shared/const';
import { getErrorMessage } from '$shared/helpers';
import type {
  DistributionInfoV1,
  HolochainDataRoot,
  HolochainPartition,
  Screen,
  WindowInfoRecord,
} from '$shared/types';
import {
  AppVersionEntrySchemaWithIcon,
  BytesSchema,
  CHECK_INITIALIZED_KEYSTORE_ERROR,
  ExtendedAppInfoSchema,
  HIDE_SETTINGS_WINDOW,
  IncludeHeadlessSchema,
  InitializeAppPortsSchema,
  InstallDefaultAppSchema,
  InstallHappFromPathSchema,
  InstallHappOrWebhappFromBytesSchema,
  InstallWebhappFromHashesSchema,
  LOADING_PROGRESS_UPDATE,
  MISSING_BINARIES,
  NO_APP_PORT_ERROR,
  NO_APPSTORE_AUTHENTICATION_TOKEN_FOUND,
  NO_AVAILABLE_PEER_HOSTS_ERROR,
  NO_DEVHUB_AUTHENTICATION_TOKEN_FOUND,
  NO_RUNNING_HOLOCHAIN_MANAGER_ERROR,
  REFETCH_DATA_IN_ALL_WINDOWS,
  UpdateUiFromHashSchema,
  WRONG_INSTALLED_APP_STRUCTURE,
} from '$shared/types';

import { BREAKING_DEFAULT_HOLOCHAIN_VERSION, checkHolochainLairBinariesExist } from './binaries';
import { validateArgs } from './cli';
import { DEFAULT_APPS_TO_INSTALL, DEVHUB_INSTALL } from './const';
import { LauncherFileSystem } from './filesystem';
import { HolochainManager } from './holochainManager';
import { IntegrityChecker } from './integrityChecker';
// import { AdminWebsocket } from '@holochain/client';
import { initializeLairKeystore, launchLairKeystore } from './lairKeystore';
import { LauncherEmitter } from './launcherEmitter';
import { setupLogs } from './logs';
import { launcherMenu } from './menu';
import { DEFAULT_APPS_DIRECTORY } from './paths';
import {
  breakingVersion,
  createObservableGeneric,
  factoryResetUtility,
  getInstalledAppsInfo,
  handleInstallError,
  installApp,
  isDevhubInstalled,
  isHappAlreadyOpened,
  processHeadlessAppInstallation,
  signZomeCall,
  throwTRPCErrorError,
  validateWithZod,
} from './utils';
import { createHappWindow, focusVisibleWindow, loadOrServe, setupAppWindows } from './windows';

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
      label: 'Quit',
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
  focusVisibleWindow(PRIVILEDGED_LAUNCHER_WINDOWS);
});

app.on('activate', () => {
  focusVisibleWindow(PRIVILEDGED_LAUNCHER_WINDOWS);
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'webhapp',
    privileges: { standard: true },
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
let PRIVILEDGED_LAUNCHER_WINDOWS: Record<Screen, BrowserWindow>; // Admin windows with special zome call signing priviledges
const WINDOW_INFO_MAP: WindowInfoRecord = {}; // WindowInfo by webContents.id - used to verify origin of zome call requests

const APP_CLIENTS: Record<InstalledAppId, AppClient> = {};
let APPSTORE_APP_CLIENT: AppstoreAppClient | undefined;
let DEVHUB_APP_CLIENT: DevhubAppClient | undefined;

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
      Object.values(PRIVILEDGED_LAUNCHER_WINDOWS)
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

  PRIVILEDGED_LAUNCHER_WINDOWS = setupAppWindows(LAUNCHER_EMITTER);

  createIPCHandler({ router, windows: Object.values(PRIVILEDGED_LAUNCHER_WINDOWS) });

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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

// app.on('will-quit', (e: Event) => {
//   // let the launcher run in the background (systray)
//   // e.preventDefault();
// })

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

async function handleSetupAndLaunch(password: string) {
  if (!PRIVILEDGED_LAUNCHER_WINDOWS)
    throw new Error('Main window needs to exist before launching.');

  if (VALIDATED_CLI_ARGS.holochainVersion.type !== 'running-external') {
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
  }

  await handleLaunch(password, false);
}

async function handleLaunch(password: string, isDirectLaunch = true) {
  INTEGRITY_CHECKER = new IntegrityChecker(password);
  LAUNCHER_FILE_SYSTEM.setIntegrityChecker(INTEGRITY_CHECKER);
  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingLairKeystore');
  let lairUrl: string;

  if (VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external') {
    lairUrl = VALIDATED_CLI_ARGS.holochainVersion.lairUrl;
    const externalLairClient = await rustUtils.LauncherLairClient.connect(lairUrl, password);
    CUSTOM_LAIR_CLIENTS[VALIDATED_CLI_ARGS.holochainVersion.adminPort] = externalLairClient;
  } else {
    if (LAIR_HANDLE) {
      LAIR_HANDLE.kill();
      LAIR_HANDLE = undefined;
    }
    const [lairHandle, lairUrl2] = await launchLairKeystore(
      VALIDATED_CLI_ARGS.lairBinaryPath,
      LAUNCHER_FILE_SYSTEM.keystoreDir,
      LAUNCHER_EMITTER,
      password,
    );

    lairUrl = lairUrl2;
    LAIR_HANDLE = lairHandle;
    DEFAULT_LAIR_CLIENT = await rustUtils.LauncherLairClient.connect(lairUrl, password);
  }

  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingHolochain');

  if (!PRIVILEDGED_LAUNCHER_WINDOWS)
    throw new Error('Main window needs to exist before launching.');

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
    INTEGRITY_CHECKER,
    password,
    VALIDATED_CLI_ARGS.holochainVersion,
    lairUrl,
    VALIDATED_CLI_ARGS.bootstrapUrl,
    VALIDATED_CLI_ARGS.signalingUrl,
    VALIDATED_CLI_ARGS.rustLog,
    VALIDATED_CLI_ARGS.wasmLog,
    nonDefaultPartition,
  );
  DEFAULT_HOLOCHAIN_DATA_ROOT = holochainDataRoot;
  HOLOCHAIN_MANAGERS[holochainDataRoot.name] = holochainManager;
  APP_PORT = holochainManager.appPort;
  // Install default apps if necessary
  // TODO check sha256 hashes
  // TODO Do not install devhub on startup

  await Promise.all(
    DEFAULT_APPS_TO_INSTALL.map(
      processHeadlessAppInstallation({
        holochainManager,
        defaultAppsNetworkSeed: DEFAULT_APPS_NETWORK_SEED,
        launcherEmitter: LAUNCHER_EMITTER,
      }),
    ),
  );

  if (isDirectLaunch) {
    PRIVILEDGED_LAUNCHER_WINDOWS[MAIN_SCREEN].setSize(WINDOW_SIZE, MIN_HEIGH, true);
  }
  loadOrServe(PRIVILEDGED_LAUNCHER_WINDOWS[SETTINGS_SCREEN], { screen: SETTINGS_SCREEN });
  return;
}

const handlePasswordInput = (handler: (password: string) => Promise<void>) =>
  t.procedure.input(z.object({ password: z.string() })).mutation((req) => {
    const {
      input: { password },
    } = req;
    return handler(password);
  });

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

const router = t.router({
  openSettings: t.procedure.mutation(() => {
    PRIVILEDGED_LAUNCHER_WINDOWS[SETTINGS_SCREEN].show();
  }),
  hideApp: t.procedure.mutation(() => {
    PRIVILEDGED_LAUNCHER_WINDOWS[MAIN_SCREEN].hide();
  }),
  openApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);

    if (isHappAlreadyOpened({ installed_app_id: appInfo.installed_app_id, WINDOW_INFO_MAP })) {
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
    WINDOW_INFO_MAP[happWindow.webContents.id] = {
      installedAppId: appInfo.installed_app_id,
      agentPubKey: appInfo.agent_pub_key,
      windowObject: happWindow,
      adminPort:
        VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external'
          ? VALIDATED_CLI_ARGS.holochainVersion.adminPort
          : undefined,
    };
    console.log(
      'WINDOW_INFO_MAP[happWindow.webContents.id]: ',
      WINDOW_INFO_MAP[happWindow.webContents.id],
    );
    happWindow.on('close', () => {
      delete WINDOW_INFO_MAP[happWindow.webContents.id];
    });
  }),
  uninstallApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);
    await holochainManager.uninstallApp(appInfo.installed_app_id);
  }),
  disableApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);
    await holochainManager.adminWebsocket.disableApp({
      installed_app_id: appInfo.installed_app_id,
    });
  }),
  enableApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);
    await holochainManager.adminWebsocket.enableApp({
      installed_app_id: appInfo.installed_app_id,
    });
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
      if (isHappAvailable && !isUiAvailable) {
        const uiBytes = await appstoreAppClient.fetchUiBytes(appVersionEntry);
        holochainManager.storeUiIfNecessary(Array.from(uiBytes), icon);
        return;
      }

      const webhappBytes = await appstoreAppClient.fetchWebappBytes(appVersionEntry);
      const { ui, happ } = webhappToHappAndUi(webhappBytes);
      holochainManager.storeUiIfNecessary(Array.from(ui), icon);
      holochainManager.storeHapp(Array.from(happ));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('No available peer host found.')) {
        return throwTRPCErrorError({
          message: NO_AVAILABLE_PEER_HOSTS_ERROR,
          cause: errorMessage,
        });
      }
      throw new Error(errorMessage);
    }
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
  handleSetupAndLaunch: handlePasswordInput(handleSetupAndLaunch),
  launch: handlePasswordInput(handleLaunch),
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
  deriveAndImportSeedFromJsonFile: t.procedure.input(z.string()).mutation(async (opts) => {
    const jsonFilePath = opts.input;
    if (!DEFAULT_LAIR_CLIENT) throw new Error('Lair client is not ready.');
    return DEFAULT_LAIR_CLIENT.deriveAndImportSeedFromJsonFile(jsonFilePath);
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
      privilegedLauncherWindows: PRIVILEDGED_LAUNCHER_WINDOWS,
      holochainManagers: HOLOCHAIN_MANAGERS,
      lairHandle: LAIR_HANDLE,
      app,
    }),
  ),
});

export type AppRouter = typeof router;
