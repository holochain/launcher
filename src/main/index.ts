import { optimizer } from '@electron-toolkit/utils';
import type { AppAuthenticationToken, InstalledAppId } from '@holochain/client';
import { type CallZomeRequest, getNonceExpiration, randomNonce } from '@holochain/client';
import { encode } from '@msgpack/msgpack';
import { initTRPC } from '@trpc/server';
import * as childProcess from 'child_process';
import { Command, Option } from 'commander';
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { app, dialog, ipcMain, protocol } from 'electron';
import contextMenu from 'electron-context-menu';
import { createIPCHandler } from 'electron-trpc/main';
import { autoUpdater } from 'electron-updater';
import fs from 'fs';
import type { ZomeCallSigner, ZomeCallUnsignedNapi } from 'hc-launcher-rust-utils';
import * as rustUtils from 'hc-launcher-rust-utils';
import os from 'os';
import path from 'path';
import semver from 'semver';
import z from 'zod';

import {
  ANIMATION_DURATION,
  APP_STORE,
  APP_STORE_APP_ID,
  DEVHUB_APP_ID,
  DISTRIBUTION_TYPE_DEFAULT_APP,
  MAIN_SCREEN,
  SEARCH_HEIGH,
  SETTINGS_SCREEN,
  WINDOW_SIZE,
  WINDOW_SIZE_LARGE,
} from '$shared/const';
import type {
  DistributionInfoV1,
  HolochainDataRoot,
  HolochainPartition,
  Screen,
  WindowInfoRecord,
} from '$shared/types';
import {
  BytesSchema,
  CHECK_INITIALIZED_KEYSTORE_ERROR,
  ExtendedAppInfoSchema,
  InitializeAppPortsSchema,
  InstallDefaultAppSchema,
  InstallHappFromPathSchema,
  InstallHappOrWebhappFromBytesSchema,
  InstallWebhappFromHashesSchema,
  LOADING_PROGRESS_UPDATE,
  MAIN_SCREEN_ROUTE,
  MainScreenRouteSchema,
  MISSING_BINARIES,
  NO_APP_PORT_ERROR,
  NO_APPSTORE_AUTHENTICATION_TOKEN_FOUND,
  NO_DEVHUB_AUTHENTICATION_TOKEN_FOUND,
  NO_RUNNING_HOLOCHAIN_MANAGER_ERROR,
  UpdateUiFromHashSchema,
  WRONG_INSTALLED_APP_STRUCTURE,
} from '$shared/types';

import { checkHolochainLairBinariesExist, DEFAULT_HOLOCHAIN_VERSION } from './binaries';
import { validateArgs } from './cli';
import { DEFAULT_APPS_TO_INSTALL, DEVHUB_INSTALL } from './const';
import { LauncherFileSystem } from './filesystem';
import { HolochainManager } from './holochainManager';
import { IntegrityChecker } from './integrityChecker';
// import { AdminWebsocket } from '@holochain/client';
import { initializeLairKeystore, launchLairKeystore } from './lairKeystore';
import { LauncherEmitter } from './launcherEmitter';
import { setupLogs } from './logs';
import { DEFAULT_APPS_DIRECTORY } from './paths';
import {
  breakingVersion,
  createObservable,
  getInstalledAppsInfo,
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
});

console.log('APP PATH: ', app.getAppPath());
console.log('RUNNING ON PLATFORM: ', process.platform);

const isFirstInstance = app.requestSingleInstanceLock();

if (!isFirstInstance && app.isPackaged) {
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
  : `launcher-dev-${os.hostname()}`;

setupLogs(LAUNCHER_EMITTER, LAUNCHER_FILE_SYSTEM);

let DEFAULT_ZOME_CALL_SIGNER: ZomeCallSigner | undefined;
// Zome call signers for external binaries (admin ports used as keys)
const CUSTOM_ZOME_CALL_SIGNERS: Record<number, ZomeCallSigner> = {};

let INTEGRITY_CHECKER: IntegrityChecker | undefined;

let APP_PORT: number | undefined;
// For now there is only one holochain data root at a time for the sake of simplicity.
let HOLOCHAIN_DATA_ROOT: HolochainDataRoot | undefined;
const HOLOCHAIN_MANAGERS: Record<string, HolochainManager> = {}; // holochain managers sorted by HolochainDataRoot.name
let LAIR_HANDLE: childProcess.ChildProcessWithoutNullStreams | undefined;
let PRIVILEDGED_LAUNCHER_WINDOWS: Record<Screen, BrowserWindow>; // Admin windows with special zome call signing priviledges
const WINDOW_INFO_MAP: WindowInfoRecord = {}; // WindowInfo by webContents.id - used to verify origin of zome call requests
const APP_AUTHENTICATION_TOKENS: Record<InstalledAppId, AppAuthenticationToken> = {};

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

  const zomeCallUnsignedNapi: ZomeCallUnsignedNapi = {
    provenance: Array.from(request.provenance),
    cellId: [Array.from(request.cell_id[0]), Array.from(request.cell_id[1])],
    zomeName: request.zome_name,
    fnName: request.fn_name,
    payload: Array.from(encode(request.payload)),
    nonce: Array.from(await randomNonce()),
    expiresAt: getNonceExpiration(),
  };

  if (windowInfo && windowInfo.adminPort) {
    // In case of externally running binaries we need to use a custom zome call signer
    const zomeCallSigner = CUSTOM_ZOME_CALL_SIGNERS[windowInfo.adminPort];
    return signZomeCall(zomeCallSigner, zomeCallUnsignedNapi);
  }
  if (!DEFAULT_ZOME_CALL_SIGNER) throw Error('Lair signer is not ready');
  return signZomeCall(DEFAULT_ZOME_CALL_SIGNER, zomeCallUnsignedNapi);
};

// https://github.com/holochain/holochain-client-js/issues/221
const handleSignZomeCallLegacy = async (e: IpcMainInvokeEvent, request: ZomeCallUnsignedNapi) => {
  const windowInfo = WINDOW_INFO_MAP[e.sender.id];
  if (request.provenance.toString() !== Array.from(windowInfo.agentPubKey).toString())
    return Promise.reject('Agent public key unauthorized.');
  if (windowInfo && windowInfo.adminPort) {
    // In case of externally running binaries we need to use a custom zome call signer
    const zomeCallSigner = CUSTOM_ZOME_CALL_SIGNERS[windowInfo.adminPort];
    return zomeCallSigner.signZomeCall(request);
  }
  if (!DEFAULT_ZOME_CALL_SIGNER) throw Error('Lair signer is not ready');
  return DEFAULT_ZOME_CALL_SIGNER.signZomeCall(request);
};

// // Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
    // Default open or close DevTools by F12 in development and ignore CommandOrControl + R in production.
  });

  console.log('BEING RUN IN __dirnmane: ', __dirname);

  PRIVILEDGED_LAUNCHER_WINDOWS = setupAppWindows();

  createIPCHandler({ router, windows: Object.values(PRIVILEDGED_LAUNCHER_WINDOWS) });

  ipcMain.handle('sign-zome-call', handleSignZomeCall);
  ipcMain.handle('sign-zome-call-legacy', handleSignZomeCallLegacy);

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
    const lairHandleTemp = childProcess.spawnSync(VALIDATED_CLI_ARGS.lairBinaryPath, ['--version']);
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

  await handleLaunch(password);
}

async function handleLaunch(password: string) {
  INTEGRITY_CHECKER = new IntegrityChecker(password);
  LAUNCHER_FILE_SYSTEM.setIntegrityChecker(INTEGRITY_CHECKER);
  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingLairKeystore');
  let lairUrl: string;

  if (VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external') {
    lairUrl = VALIDATED_CLI_ARGS.holochainVersion.lairUrl;
    const externalZomeCallSigner = await rustUtils.ZomeCallSigner.connect(lairUrl, password);
    CUSTOM_ZOME_CALL_SIGNERS[VALIDATED_CLI_ARGS.holochainVersion.adminPort] =
      externalZomeCallSigner;
  } else {
    const [lairHandle, lairUrl2] = await launchLairKeystore(
      VALIDATED_CLI_ARGS.lairBinaryPath,
      LAUNCHER_FILE_SYSTEM.keystoreDir,
      LAUNCHER_EMITTER,
      password,
    );

    lairUrl = lairUrl2;

    LAIR_HANDLE = lairHandle;

    DEFAULT_ZOME_CALL_SIGNER = await rustUtils.ZomeCallSigner.connect(lairUrl, password);
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
  HOLOCHAIN_DATA_ROOT = holochainDataRoot;
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

  // Issue authentication tokens for appstore and devhub
  const appstoreTokenResponse = await holochainManager.adminWebsocket.issueAppAuthenticationToken({
    installed_app_id: APP_STORE_APP_ID,
    expiry_seconds: 9999999,
    single_use: false,
  });
  APP_AUTHENTICATION_TOKENS[APP_STORE_APP_ID] = appstoreTokenResponse.token;
  if (
    holochainManager.installedApps
      .map((appInfo) => appInfo.installed_app_id)
      .includes(DEVHUB_APP_ID)
  ) {
    const devhubTokenResponse = await holochainManager.adminWebsocket.issueAppAuthenticationToken({
      installed_app_id: DEVHUB_APP_ID,
      expiry_seconds: 9999999,
      single_use: false,
    });
    APP_AUTHENTICATION_TOKENS[DEVHUB_APP_ID] = devhubTokenResponse.token;
  }

  PRIVILEDGED_LAUNCHER_WINDOWS[MAIN_SCREEN].setSize(WINDOW_SIZE, SEARCH_HEIGH, true);
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

const router = t.router({
  openSettings: t.procedure.mutation(() => {
    PRIVILEDGED_LAUNCHER_WINDOWS[MAIN_SCREEN].hide();
    PRIVILEDGED_LAUNCHER_WINDOWS[SETTINGS_SCREEN].show();
  }),
  closeSettings: t.procedure.input(MainScreenRouteSchema).mutation(async ({ input: page }) => {
    LAUNCHER_EMITTER.emit(MAIN_SCREEN_ROUTE, page);
    PRIVILEDGED_LAUNCHER_WINDOWS[SETTINGS_SCREEN].hide();
    if (page === APP_STORE) {
      PRIVILEDGED_LAUNCHER_WINDOWS[MAIN_SCREEN].setSize(WINDOW_SIZE_LARGE, WINDOW_SIZE, true);
    }
    setTimeout(() => {
      PRIVILEDGED_LAUNCHER_WINDOWS[MAIN_SCREEN].show();
    }, ANIMATION_DURATION);
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

    const maybeExistingToken = APP_AUTHENTICATION_TOKENS[appInfo.installed_app_id];
    const appAuthenticationToken = maybeExistingToken
      ? maybeExistingToken
      : (
          await holochainManager.adminWebsocket.issueAppAuthenticationToken({
            installed_app_id: appInfo.installed_app_id,
            expiry_seconds: 9999999, // TODO set to zero once unlimited tokens are supported
            single_use: false,
          })
        ).token;

    APP_AUTHENTICATION_TOKENS[appInfo.installed_app_id] = appAuthenticationToken;

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
  installHappFromPath: t.procedure.input(InstallHappFromPathSchema).mutation(async (opts) => {
    const { filePath, appId, networkSeed } = opts.input;

    const happAndUiBytes = await rustUtils.readAndDecodeHappOrWebhapp(filePath);

    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);

    const distributionInfo: DistributionInfoV1 = {
      type: 'filesystem',
    };

    if (happAndUiBytes.uiBytes) {
      await holochainManager.installWebHappFromBytes(
        happAndUiBytes,
        appId,
        distributionInfo,
        networkSeed,
      );
    } else {
      await holochainManager.installHeadlessHappFromBytes(
        happAndUiBytes.happBytes,
        appId,
        distributionInfo,
        networkSeed,
      );
    }
  }),
  isHappAvailableAndValid: t.procedure.input(z.string()).query(async (opts) => {
    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.isHappAvailableAndValid(opts.input);
  }),
  areUiBytesAvailable: t.procedure.input(z.string()).query(async (opts) => {
    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.isUiAvailable(opts.input);
  }),
  storeUiBytes: t.procedure.input(BytesSchema).mutation(async (opts) => {
    const { bytes } = opts.input;
    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.storeUiIfNecessary(Array.from(bytes));
  }),
  storeHappBytes: t.procedure.input(BytesSchema).mutation(async (opts) => {
    const { bytes } = opts.input;
    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
    return holochainManager.storeHapp(Array.from(bytes));
  }),
  installWebhappFromHashes: t.procedure
    .input(InstallWebhappFromHashesSchema) // TODO: need metadata input as well here like name and action hash of app and app version in app store
    .mutation(async (opts) => {
      const { happSha256, uiZipSha256, appId, distributionInfo, networkSeed } = opts.input;
      const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
      await holochainManager.installWebhappFromHashes(
        happSha256,
        uiZipSha256,
        appId,
        distributionInfo,
        networkSeed,
      );
    }),
  installWebhappFromBytes: t.procedure
    .input(InstallHappOrWebhappFromBytesSchema)
    .mutation(async (opts) => {
      const { bytes, appId, distributionInfo, networkSeed } = opts.input;

      const happAndUiBytes = await rustUtils.decodeHappOrWebhapp(Array.from(bytes));

      const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);

      if (happAndUiBytes.uiBytes) {
        await holochainManager.installWebHappFromBytes(
          happAndUiBytes,
          appId,
          distributionInfo,
          networkSeed,
        );
      } else {
        await holochainManager.installHeadlessHappFromBytes(
          happAndUiBytes.happBytes,
          appId,
          distributionInfo,
          networkSeed,
        );
      }
    }),
  installDefaultApp: t.procedure.input(InstallDefaultAppSchema).mutation(async (opts) => {
    const { name, appId, networkSeed } = opts.input;

    const filePath = path.join(DEFAULT_APPS_DIRECTORY, name);

    const happAndUiBytes = await rustUtils.readAndDecodeHappOrWebhapp(filePath);

    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);

    if (happAndUiBytes.uiBytes) {
      await holochainManager.installWebHappFromBytes(
        happAndUiBytes,
        appId,
        {
          type: DISTRIBUTION_TYPE_DEFAULT_APP,
        },
        networkSeed,
      );
    } else {
      await holochainManager.installHeadlessHappFromBytes(
        happAndUiBytes.happBytes,
        appId,
        {
          type: DISTRIBUTION_TYPE_DEFAULT_APP,
        },
        networkSeed,
      );
    }
  }),
  updateUiFromHash: t.procedure.input(UpdateUiFromHashSchema).mutation((opts) => {
    const { uiZipSha256, appId, appVersionActionHash } = opts.input;
    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
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
    () => HOLOCHAIN_MANAGERS[DEFAULT_HOLOCHAIN_VERSION].version,
  ),
  isDevhubInstalled: t.procedure.query(() => isDevhubInstalled(HOLOCHAIN_MANAGERS)),
  getInstalledApps: t.procedure.query(() => {
    const installedApps = getInstalledAppsInfo(HOLOCHAIN_MANAGERS);

    return validateWithZod({
      schema: z.array(ExtendedAppInfoSchema),
      data: installedApps,
      errorType: WRONG_INSTALLED_APP_STRUCTURE,
    });
  }),
  handleSetupAndLaunch: handlePasswordInput(handleSetupAndLaunch),
  launch: handlePasswordInput(handleLaunch),
  initializeDefaultAppPorts: t.procedure.query(() => {
    const appstoreAuthenticationToken = APP_AUTHENTICATION_TOKENS[APP_STORE_APP_ID];
    const devhubAuthenticationToken = APP_AUTHENTICATION_TOKENS[DEVHUB_APP_ID];
    if (!appstoreAuthenticationToken) {
      return throwTRPCErrorError({
        message: NO_APPSTORE_AUTHENTICATION_TOKEN_FOUND,
      });
    }
    if (isDevhubInstalled(HOLOCHAIN_MANAGERS) && !devhubAuthenticationToken) {
      return throwTRPCErrorError({
        message: NO_DEVHUB_AUTHENTICATION_TOKEN_FOUND,
      });
    }
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
    const defaultHolochainManager = HOLOCHAIN_MANAGERS[DEFAULT_HOLOCHAIN_VERSION];
    await processHeadlessAppInstallation({
      holochainManager: defaultHolochainManager,
      defaultAppsNetworkSeed: DEFAULT_APPS_NETWORK_SEED,
      launcherEmitter: LAUNCHER_EMITTER,
    })(DEVHUB_INSTALL);

    const authenticationTokenResponse =
      await defaultHolochainManager.adminWebsocket.issueAppAuthenticationToken({
        installed_app_id: DEVHUB_INSTALL.id,
        expiry_seconds: 9999999,
        single_use: false,
      });

    return {
      appPort: APP_PORT,
      authenticationToken: authenticationTokenResponse.token,
    };
  }),
  onSetupProgressUpdate: t.procedure.subscription(() => {
    return createObservable(LAUNCHER_EMITTER, LOADING_PROGRESS_UPDATE);
  }),
  mainScreenRoute: t.procedure.subscription(() => {
    return createObservable(LAUNCHER_EMITTER, MAIN_SCREEN_ROUTE);
  }),
});

export type AppRouter = typeof router;
