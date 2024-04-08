import { optimizer } from '@electron-toolkit/utils';
import {
  type AppInfo,
  type CallZomeRequest,
  getNonceExpiration,
  randomNonce,
} from '@holochain/client';
import { encode } from '@msgpack/msgpack';
import { initTRPC } from '@trpc/server';
import * as childProcess from 'child_process';
import { Command, Option } from 'commander';
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { app, dialog, ipcMain, protocol } from 'electron';
import { createIPCHandler } from 'electron-trpc/main';
import { autoUpdater } from 'electron-updater';
import type { ZomeCallSigner, ZomeCallUnsignedNapi } from 'hc-launcher-rust-utils';
import os from 'os';
import path from 'path';
import semver from 'semver';
import z from 'zod';

import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';
import type {
  HolochainDataRoot,
  HolochainPartition,
  Screen,
  WindowInfoRecord,
} from '$shared/types';
import {
  ANIMATION_DURATION,
  CHECK_INITIALIZED_KEYSTORE_ERROR,
  ExtendedAppInfoSchema,
  FILE_UNDEFINED_ERROR,
  InstallHappInputSchema,
  InstallKandoSchema,
  LOADING_PROGRESS_UPDATE,
  MAIN_SCREEN,
  MAIN_SCREEN_ROUTE,
  MainScreenRouteSchema,
  MISSING_BINARIES,
  NO_RUNNING_HOLOCHAIN_MANAGER_ERROR,
  SETTINGS_SCREEN,
  WRONG_INSTALLED_APP_STRUCTURE,
} from '$shared/types';

import { checkHolochainLairBinariesExist } from './binaries';
import { validateArgs } from './cli';
import { APPS_TO_INSTALL, SEARCH_HEIGH, WINDOW_SIZE } from './const';
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
  isHappAlreadyOpened,
  signZomeCall,
  throwTRPCErrorError,
  validateWithZod,
} from './utils';
import { createHappWindow, focusVisibleWindow, loadOrServe, setupAppWindows } from './windows';

const t = initTRPC.create({ isServer: true });

const rustUtils = require('hc-launcher-rust-utils');

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

console.log('APP PATH: ', app.getAppPath());
console.log('RUNNING ON PLATFORM: ', process.platform);

const isFirstInstance = app.requestSingleInstanceLock();

if (!isFirstInstance) {
  app.quit();
}

app.on('second-instance', () => {
  focusVisibleWindow(LAUNCHER_WINDOWS);
});

app.on('activate', () => {
  focusVisibleWindow(LAUNCHER_WINDOWS);
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'webhapp',
    privileges: { standard: true },
  },
]);

const LAUNCHER_FILE_SYSTEM = LauncherFileSystem.connect(app, VALIDATED_CLI_ARGS.profile);
const LAUNCHER_EMITTER = new LauncherEmitter();

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
let LAUNCHER_WINDOWS: Record<Screen, BrowserWindow>;
const WINDOW_INFO_MAP: WindowInfoRecord = {}; // WindowInfo by webContents.id - used to verify origin of zome call requests

const handleSignZomeCall = async (e: IpcMainInvokeEvent, request: CallZomeRequest) => {
  // TODO check here that cellId belongs to the installedAppId that the window belongs to
  const windowInfo = WINDOW_INFO_MAP[e.sender.id];
  if (
    windowInfo &&
    request.provenance.toString() !== Array.from(windowInfo.agentPubKey).toString()
  ) {
    return Promise.reject('Agent public key unauthorized.');
  } else {
    // Launcher admin windows get a wildcard to have any zome calls signed
    if (
      !Object.values(LAUNCHER_WINDOWS)
        .map((window) => window.webContents.id)
        .includes(e.sender.id)
    ) {
      return Promise.reject('Agent public key unauthorized.');
    }
  }

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

  LAUNCHER_WINDOWS = setupAppWindows();

  createIPCHandler({ router, windows: Object.values(LAUNCHER_WINDOWS) });

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
        await autoUpdater.downloadUpdate();
        const options: Electron.RelaunchOptions = {
          args: process.argv,
        };
        // https://github.com/electron-userland/electron-builder/issues/1727#issuecomment-769896927
        if (process.env.APPIMAGE) {
          options.args!.unshift('--appimage-extract-and-run');
          options.execPath = process.env.APPIMAGE.replace(
            appVersion,
            updateCheckResult.updateInfo.version,
          );
        }
        app.relaunch(options);
        app.exit(0);
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
  if (!LAUNCHER_WINDOWS) throw new Error('Main window needs to exist before launching.');

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

  if (!LAUNCHER_WINDOWS) throw new Error('Main window needs to exist before launching.');

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
  const defaultAppsNetworkSeed = app.isPackaged
    ? `launcher-${breakingVersion(app.getVersion())}`
    : `launcher-dev-${os.hostname()}`;

  APPS_TO_INSTALL.forEach(async ({ id, sha256, name, progressUpdate }) => {
    if (!holochainManager.installedApps.map((app) => app.installed_app_id).includes(id)) {
      LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, progressUpdate);
      await holochainManager.installHeadlessHapp(
        path.join(DEFAULT_APPS_DIRECTORY, name),
        id,
        sha256,
        defaultAppsNetworkSeed,
      );
    }
  });

  LAUNCHER_WINDOWS[MAIN_SCREEN].setSize(WINDOW_SIZE, SEARCH_HEIGH, true);
  loadOrServe(LAUNCHER_WINDOWS[SETTINGS_SCREEN], { screen: SETTINGS_SCREEN });
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
    LAUNCHER_WINDOWS[MAIN_SCREEN].hide();
    LAUNCHER_WINDOWS[SETTINGS_SCREEN].show();
  }),
  closeSettings: t.procedure.input(MainScreenRouteSchema).mutation(async (opts) => {
    LAUNCHER_EMITTER.emit(MAIN_SCREEN_ROUTE, opts.input);
    LAUNCHER_WINDOWS[SETTINGS_SCREEN].hide();
    setTimeout(() => {
      LAUNCHER_WINDOWS[MAIN_SCREEN].show();
    }, ANIMATION_DURATION);
  }),
  hideApp: t.procedure.mutation(() => {
    LAUNCHER_WINDOWS[MAIN_SCREEN].hide();
  }),
  openApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);

    if (isHappAlreadyOpened({ installed_app_id: appInfo.installed_app_id, WINDOW_INFO_MAP })) {
      return;
    }

    const happWindow = createHappWindow(
      opts.input,
      LAUNCHER_FILE_SYSTEM,
      LAUNCHER_EMITTER,
      holochainManager.appPort,
    );
    WINDOW_INFO_MAP[happWindow.webContents.id] = {
      installedAppId: appInfo.installed_app_id,
      agentPubKey: appInfo.agent_pub_key,
      adminPort:
        VALIDATED_CLI_ARGS.holochainVersion.type === 'running-external'
          ? VALIDATED_CLI_ARGS.holochainVersion.adminPort
          : undefined,
    };
    happWindow.on('close', () => {
      delete WINDOW_INFO_MAP[happWindow.webContents.id];
    });
  }),
  uninstallApp: t.procedure.input(ExtendedAppInfoSchema).mutation(async (opts) => {
    const { appInfo, holochainDataRoot } = opts.input;
    const holochainManager = getHolochainManager(holochainDataRoot.name);
    await holochainManager.uninstallApp(appInfo.installed_app_id);
  }),
  installHapp: t.procedure.input(InstallHappInputSchema).mutation(async (opts) => {
    const { filePath, appId, networkSeed } = opts.input;

    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
    if (!filePath) {
      throwTRPCErrorError({
        message: FILE_UNDEFINED_ERROR,
      });
    }
    await holochainManager.installWebHapp(filePath, appId, networkSeed);
  }),
  installKando: t.procedure.input(InstallKandoSchema).mutation(async (opts) => {
    const { appId, networkSeed } = opts.input;

    const filePath = path.join(DEFAULT_APPS_DIRECTORY, 'kando.webhapp');

    const holochainManager = getHolochainManager(HOLOCHAIN_DATA_ROOT!.name);
    await holochainManager.installWebHapp(filePath, appId, networkSeed);
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
  holochainVersion: t.procedure.query(
    () => HOLOCHAIN_MANAGERS[Object.keys(HOLOCHAIN_MANAGERS)[0]].version,
  ),
  isDevhubInstalled: t.procedure.query(() =>
    Object.values(HOLOCHAIN_MANAGERS)
      .flatMap((manager) => manager.installedApps)
      .some((app) => app.installed_app_id === DEVHUB_APP_ID),
  ),
  getInstalledApps: t.procedure.query(() => {
    const filterHeadlessApps = (app: { installed_app_id: string }) =>
      ![DEVHUB_APP_ID, APP_STORE_APP_ID].includes(app.installed_app_id);
    const mapAppInfo = (manager: HolochainManager) => (app: AppInfo) => ({
      appInfo: app,
      version: manager.version,
      holochainDataRoot: manager.holochainDataRoot,
    });

    const installedApps = Object.values(HOLOCHAIN_MANAGERS).flatMap((manager) =>
      manager.installedApps.filter(filterHeadlessApps).map(mapAppInfo(manager)),
    );

    return validateWithZod({
      schema: z.array(ExtendedAppInfoSchema),
      data: installedApps,
      errorType: WRONG_INSTALLED_APP_STRUCTURE,
    });
  }),
  handleSetupAndLaunch: handlePasswordInput(handleSetupAndLaunch),
  launch: handlePasswordInput(handleLaunch),
  getAppPort: t.procedure.query(() => APP_PORT),
  onSetupProgressUpdate: t.procedure.subscription(() => {
    return createObservable(LAUNCHER_EMITTER, LOADING_PROGRESS_UPDATE);
  }),
  mainScreenRoute: t.procedure.subscription(() => {
    return createObservable(LAUNCHER_EMITTER, MAIN_SCREEN_ROUTE);
  }),
});

export type AppRouter = typeof router;
