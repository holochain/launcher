import { is } from '@electron-toolkit/utils';
import crypto from 'crypto';
import {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  nativeImage,
  net,
  session,
  Tray,
} from 'electron';
import serve from 'electron-serve';
import path from 'path';
import url from 'url';

import { MAIN_SCREEN, SETTINGS_SCREEN } from '$shared/const';
import type { ExtendedAppInfo, Screen } from '$shared/types';
import { LAUNCHER_ERROR } from '$shared/types';

import { SEARCH_HEIGH, WINDOW_SIZE } from './const';
import type { LauncherFileSystem } from './filesystem';
import { type UiHashes } from './holochainManager';
import { type LauncherEmitter } from './launcherEmitter';
import { ICONS_DIRECTORY } from './paths';
import { encodeQuery, setLinkOpenHandlers } from './utils';

const serveURL = serve({ directory: path.join(__dirname, '..', 'renderer') });

const loadVite = (window: BrowserWindow, query: Record<string, string> = {}): void => {
  if (!window) return;
  const queryString = encodeQuery(query);
  const load = () => window.loadURL(`http://localhost:5173?${queryString}`);
  try {
    load();
  } catch (e) {
    console.log('Error loading URL, retrying', e);
    setTimeout(load, 200);
  }
};

export const loadOrServe = is.dev ? loadVite : serveURL;

/**
 * Admin windows have special priviledges when it comes to zome call signing. Normal happs must run
 * in happ windows with lower priviledges.
 *
 * @param title
 * @returns
 */
const createAdminWindow = (title: string) =>
  new BrowserWindow({
    frame: false,
    width: WINDOW_SIZE,
    minWidth: WINDOW_SIZE,
    height: WINDOW_SIZE,
    title: title,
    show: false,
    webPreferences: {
      preload: path.resolve(__dirname, '../preload/admin.js'),
    },
  });

export const focusVisibleWindow = (launcherWindows: Record<Screen, BrowserWindow>) => {
  const windows = Object.values(launcherWindows);
  const anyVisible = windows.some((window) => !window.isMinimized() && window.isVisible());

  if (!anyVisible) {
    launcherWindows[MAIN_SCREEN].show();
  } else {
    windows.find((window) => !window.isMinimized() && window.isVisible())?.focus();
  }
};

export const setupAppWindows = () => {
  let isQuitting = false;
  // Create the browser window.
  const mainWindow = createAdminWindow('Holochain Launcher');

  const settingsWindow = createAdminWindow('Holochain Launcher Settings');

  const icon = nativeImage.createFromPath(path.join(ICONS_DIRECTORY, '16x16.png'));
  const tray = new Tray(icon);

  loadOrServe(mainWindow, { screen: MAIN_SCREEN });

  const windows: Record<Screen, BrowserWindow> = {
    [MAIN_SCREEN]: mainWindow,
    [SETTINGS_SCREEN]: settingsWindow,
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      type: 'normal',
      click() {
        focusVisibleWindow(windows);
      },
    },
    ...(is.dev
      ? [
          {
            label: 'Open dev tools',
            type: 'normal' as const,
            click: () =>
              Object.values(windows)
                .filter((window) => !window.isMinimized() && window.isVisible())
                .forEach((window) => window.webContents.openDevTools()),
          },
        ]
      : []),
    {
      label: 'Restart',
      type: 'normal',
      click() {
        const options: Electron.RelaunchOptions = {
          args: process.argv,
        };
        // https://github.com/electron-userland/electron-builder/issues/1727#issuecomment-769896927
        if (process.env.APPIMAGE) {
          console.log('process.execPath: ', process.execPath);
          options.args!.unshift('--appimage-extract-and-run');
          options.execPath = process.env.APPIMAGE;
        }
        app.relaunch(options);
        app.exit(0);
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

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    mainWindow.setSize(WINDOW_SIZE, SEARCH_HEIGH);
    focusVisibleWindow(windows);
  });

  app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll();
  });

  app.on('before-quit', () => {
    isQuitting = true;
  });

  settingsWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      settingsWindow.hide();
      mainWindow.show();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return windows;
};

export const createHappWindow = (
  extendedAppInfo: ExtendedAppInfo,
  launcherFileSystem: LauncherFileSystem,
  launcherEmitter: LauncherEmitter,
  appPort: number | undefined,
  // TODO pass UI asset hashes here
): BrowserWindow => {
  // TODO create mapping between installed-app-id's and window ids
  if (!appPort) throw new Error('App port not defined.');
  const appId = extendedAppInfo.appInfo.installed_app_id;
  const holochainDataRoot = extendedAppInfo.holochainDataRoot;
  const appUiDir = launcherFileSystem.appUiDir(
    extendedAppInfo.appInfo.installed_app_id,
    extendedAppInfo.holochainDataRoot,
  );
  if (!launcherFileSystem.integrityChecker)
    throw new Error('IntegrityChecker must be set before creating a happ window.');
  const uiHashes = launcherFileSystem.integrityChecker.readSignedJSON<UiHashes>(
    path.join(appUiDir, 'hashes.json'),
  );
  const partition = `persist:${holochainDataRoot.name}#${appId}`;
  const ses = session.fromPartition(partition);
  ses.protocol.handle('webhapp', async (request) => {
    // console.log("### Got file request: ", request);
    const uriWithoutProtocol = request.url.slice('webhapp://'.length);
    const filePathComponents = uriWithoutProtocol.split('/').slice(1);
    const filePath = path.join(...filePathComponents);
    const response = await net.fetch(
      url.pathToFileURL(path.join(appUiDir, 'assets', filePath)).toString(),
    );

    const expectedHash = uiHashes[filePath];
    if (!expectedHash) {
      launcherEmitter.emit(
        LAUNCHER_ERROR,
        `Failed to load asset '${filePath}': File is not in the list of files that have been installed with this UI.`,
      );
      throw new Error(
        `Failed to load asset '${filePath}': File is not in the list of files that have been installed with this UI.`,
      );
    }
    const hasher = crypto.createHash('sha256');
    const arrayBuffer = await response.arrayBuffer();
    const bodyBuffer = Buffer.from(arrayBuffer);
    hasher.update(bodyBuffer);
    const hash = hasher.digest('hex');
    if (hash !== expectedHash) {
      launcherEmitter.emit(LAUNCHER_ERROR, `Failed to load asset '${filePath}': Invalid Hash.`);
      throw new Error(`Failed to load asset '${filePath}': Invalid hash.`);
    }

    if (!filePath.endsWith('index.html')) {
      return new Response(arrayBuffer, response);
    } else {
      const indexHtml = bodyBuffer.toString('utf-8');
      let modifiedContent = indexHtml.replace(
        '<head>',
        `<head><script type="module">window.__HC_LAUNCHER_ENV__ = { APP_INTERFACE_PORT: ${appPort}, INSTALLED_APP_ID: "${appId}", FRAMEWORK: "electron" };</script>`,
      );
      // remove title attribute to be able to set title to app id later
      modifiedContent = modifiedContent.replace(/<title>.*?<\/title>/i, '');
      return new Response(modifiedContent, response);
    }
  });
  // Create the browser window.
  const happWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, '../preload/happs.js'),
      partition,
    },
  });

  happWindow.menuBarVisible = false;

  happWindow.setTitle(appId);

  setLinkOpenHandlers(happWindow);

  happWindow.on('close', () => {
    console.log(`Happ window with frame id ${happWindow.id} about to be closed.`);
    // prevent closing here and hide instead in case notifications are to be received from this happ UI
  });

  happWindow.on('closed', () => {
    // remove protocol handler
    ses.protocol.unhandle('webhapp');
    // happWindow = null;
  });
  console.log('Loading happ window file');
  happWindow.loadURL(`webhapp://webhappwindow/index.html`);
  return happWindow;
};
