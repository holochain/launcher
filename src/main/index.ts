/* eslint-disable @typescript-eslint/no-var-requires */
import { AgentPubKey } from '@holochain/client';
import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { ArgumentParser } from 'argparse';
import * as childProcess from 'child_process';
import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  Menu,
  nativeImage,
  protocol,
  Tray,
} from 'electron';
import getPort from 'get-port';
import { ZomeCallSigner, ZomeCallUnsignedNapi } from 'hc-launcher-rust-utils';
import path from 'path';
import z from 'zod';

import {
  ExtendedAppInfo,
  LOADING_PROGRESS_UPDATE,
  LoadingProgressUpdate,
  RunningHolochain,
} from '../types';
import { LAIR_BINARY } from './binaries';
import { LauncherFileSystem } from './filesystem';
import { HolochainManager } from './holochainManager';
// import { AdminWebsocket } from '@holochain/client';
import { initializeLairKeystore, launchLairKeystore } from './lairKeystore';
import { LauncherEmitter } from './launcherEmitter';
import { setupLogs } from './logs';
import { DEFAULT_APPS_DIRECTORY, ICONS_DIRECTORY } from './paths';
import { createHappWindow, createOrShowMainWindow } from './windows';

const t = initTRPC.create({ isServer: true });

const rustUtils = require('hc-launcher-rust-utils');
// import * as rustUtils from 'hc-launcher-rust-utils';

const appName = app.getName();

if (process.env.NODE_ENV === 'development') {
  console.log('APP IS RUN IN DEVELOPMENT MODE');
  app.setName(appName + '-dev');
}

console.log('APP PATH: ', app.getAppPath());
console.log('RUNNING ON PLATFORM: ', process.platform);

const parser = new ArgumentParser({
  description: 'Holochain Launcher',
});
parser.add_argument('-p', '--profile', {
  help: 'Opens the launcher with a custom profile instead of the default profile.',
  type: 'string',
});

const allowedProfilePattern = /^[0-9a-zA-Z-]+$/;
const args = parser.parse_args();
if (args.profile && !allowedProfilePattern.test(args.profile)) {
  throw new Error(
    'The --profile argument may only contain digits (0-9), letters (a-z,A-Z) and dashes (-)',
  );
}

const isFirstInstance = app.requestSingleInstanceLock();

if (!isFirstInstance) {
  app.quit();
}

app.on('second-instance', () => {
  MAIN_WINDOW = createOrShowMainWindow(MAIN_WINDOW, router);
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'webhapp',
    privileges: { standard: true },
  },
]);

const LAUNCHER_FILE_SYSTEM = LauncherFileSystem.connect(app, args.profile);
const LAUNCHER_EMITTER = new LauncherEmitter();

setupLogs(LAUNCHER_EMITTER, LAUNCHER_FILE_SYSTEM);

let ZOME_CALL_SIGNER: ZomeCallSigner | undefined;
// let ADMIN_WEBSOCKET: AdminWebsocket | undefined;
// let ADMIN_PORT: number | undefined;
const HOLOCHAIN_MANAGERS: Record<string, HolochainManager> = {}; // holochain managers sorted by partition
let LAIR_HANDLE: childProcess.ChildProcessWithoutNullStreams | undefined;
let MAIN_WINDOW: BrowserWindow | undefined | null;
const AGENT_KEY_WINDOW_MAP: Record<number, AgentPubKey> = {}; // AgentPubKey by webContents.id - used to verify origin of zome call requests

const handleSignZomeCall = (e: IpcMainInvokeEvent, zomeCall: ZomeCallUnsignedNapi) => {
  if (zomeCall.provenance.toString() !== Array.from(AGENT_KEY_WINDOW_MAP[e.sender.id]).toString())
    return Promise.reject('Agent public key unauthorized.');
  if (!ZOME_CALL_SIGNER) throw Error('Lair signer is not ready');
  return ZOME_CALL_SIGNER.signZomeCall(zomeCall);
};

// // Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

let tray;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  console.log('BEING RUN IN __dirnmane: ', __dirname);
  const icon = nativeImage.createFromPath(path.join(ICONS_DIRECTORY, '16x16.png'));
  tray = new Tray(icon);

  MAIN_WINDOW = createOrShowMainWindow(MAIN_WINDOW, router);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      type: 'normal',
      click() {
        MAIN_WINDOW = createOrShowMainWindow(MAIN_WINDOW, router);
      },
    },
    {
      label: 'Quit',
      type: 'normal',
      click() {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Holochain Launcher');
  tray.setContextMenu(contextMenu);

  ipcMain.handle('sign-zome-call', handleSignZomeCall);
  ipcMain.handle('open-app', async (_e, extendedAppInfo: ExtendedAppInfo) => {
    const holochainManager = HOLOCHAIN_MANAGERS[extendedAppInfo.partition];
    if (!holochainManager)
      throw new Error('Responsible Holochain Manager seems not to be running.');
    const happWindow = createHappWindow(
      extendedAppInfo,
      LAUNCHER_FILE_SYSTEM,
      holochainManager.appPort,
    );
    AGENT_KEY_WINDOW_MAP[happWindow.webContents.id] = extendedAppInfo.appInfo.agent_pub_key;
    happWindow.on('close', () => {
      delete AGENT_KEY_WINDOW_MAP[happWindow.webContents.id];
    });
  });
  ipcMain.handle(
    'install-app',
    async (_e, filePath: string, appId: string, partition: string, networkSeed: string) => {
      if (filePath === '#####REQUESTED_KANDO_INSTALLATION#####') {
        console.log('Got request to install KanDo.');
        filePath = path.join(DEFAULT_APPS_DIRECTORY, 'kando.webhapp');
      }
      if (!appId || appId === '') {
        throw new Error('No app id provided.');
      }

      const holochainManager = HOLOCHAIN_MANAGERS[partition];
      if (!holochainManager) {
        throw new Error(
          `No running Holochain Manager found for the specified partition: '${partition}'`,
        );
      }
      await holochainManager.installWebHapp(filePath, appId, networkSeed);
    },
  );
  ipcMain.handle('uninstall-app', async (_e, appId: string, partition: string) => {
    const holochainManager = HOLOCHAIN_MANAGERS[partition];
    if (!holochainManager) {
      throw new Error(
        `No running Holochain Manager found for the specified partition: ${partition}`,
      );
    }
    await holochainManager.uninstallApp(appId);
  });
  ipcMain.handle('get-installed-apps', async () => {
    return Object.values(HOLOCHAIN_MANAGERS)
      .map((manager) =>
        manager.installedApps.map((app) => {
          return {
            appInfo: app,
            version: manager.version,
            partition: manager.partition,
          };
        }),
      )
      .flat();
  });

  ipcMain.handle('ipc-handlers-ready', () => true);

  MAIN_WINDOW!.webContents.send('ipc-handlers-ready');
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createOrShowMainWindow(MAIN_WINDOW, router);
  }
});

// app.on('will-quit', (e: Event) => {
//   // let the launcher run in the background (systray)
//   // e.preventDefault();
// })

app.on('quit', () => {
  if (LAIR_HANDLE) {
    LAIR_HANDLE.kill();
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
  if (!MAIN_WINDOW) throw new Error('Main window needs to exist before launching.');

  const lairHandleTemp = childProcess.spawnSync(LAIR_BINARY, ['--version']);
  if (!lairHandleTemp.stdout) {
    console.error(`Failed to run lair-keystore binary:\n${lairHandleTemp}`);
  }
  console.log(`Got lair version ${lairHandleTemp.stdout.toString()}`);
  if (!LAUNCHER_FILE_SYSTEM.keystoreInitialized()) {
    LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingLairKeystore');
    await initializeLairKeystore(
      LAIR_BINARY,
      LAUNCHER_FILE_SYSTEM.keystoreDir,
      LAUNCHER_EMITTER,
      password,
    );
  }

  await handleLaunch(password);
}

async function handleLaunch(password: string) {
  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingLairKeystore');

  const [lairHandle, lairUrl] = await launchLairKeystore(
    LAIR_BINARY,
    LAUNCHER_FILE_SYSTEM.keystoreDir,
    LAUNCHER_EMITTER,
    password,
  );
  LAIR_HANDLE = lairHandle;

  if (!MAIN_WINDOW) throw new Error('Main window needs to exist before launching.');
  ZOME_CALL_SIGNER = await rustUtils.ZomeCallSigner.connect(lairUrl, password);

  LAUNCHER_EMITTER.emit(LOADING_PROGRESS_UPDATE, 'startingHolochain');

  const adminPort = await getPort();

  const holochainManager = await HolochainManager.launch(
    LAUNCHER_EMITTER,
    LAUNCHER_FILE_SYSTEM,
    password,
    {
      type: 'built-in',
      version: '0.2.3',
    },
    adminPort,
    lairUrl,
    undefined,
    undefined,
    undefined,
  );
  HOLOCHAIN_MANAGERS['0.2.x'] = holochainManager;

  emitToWindow<RunningHolochain[]>(MAIN_WINDOW, 'holochain-ready', [
    {
      version: holochainManager.version,
      partition: holochainManager.partition,
      appPort: holochainManager.appPort,
    },
  ]);
  return;
}

const handlePasswordInput = (handler: (password: string) => Promise<void>) =>
  t.procedure.input(z.object({ password: z.string() })).mutation((req) => {
    const {
      input: { password },
    } = req;
    return handler(password);
  });

const router = t.router({
  handleSetupAndLaunch: handlePasswordInput(handleSetupAndLaunch),
  launch: handlePasswordInput(handleLaunch),
  lairSetupRequired: t.procedure.query(() => {
    const isInitialized = LAUNCHER_FILE_SYSTEM.keystoreInitialized();
    if (!z.boolean().safeParse(isInitialized).success) {
      throw new Error('Expected boolean value for keystore initialization status');
    }
    return !isInitialized;
  }),
  onSetupProgressUpdate: t.procedure.subscription(() => {
    return observable<LoadingProgressUpdate>((emit) => {
      function onProgressUpdate(text: LoadingProgressUpdate) {
        emit.next(text);
      }

      LAUNCHER_EMITTER.on(LOADING_PROGRESS_UPDATE, onProgressUpdate);

      return () => {
        LAUNCHER_EMITTER.off(LOADING_PROGRESS_UPDATE, onProgressUpdate);
      };
    });
  }),
});

function emitToWindow<T>(targetWindow: BrowserWindow, channel: string, payload: T): void {
  targetWindow.webContents.send(channel, payload);
}

export type AppRouter = typeof router;
