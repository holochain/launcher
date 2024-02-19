import { is } from '@electron-toolkit/utils';
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
import path, { join, resolve } from 'path';
import url from 'url';

import type { ExtendedAppInfo, Screen } from '../types';
import { mainScreen, settingsScreen } from '../types';
import { SEARCH_HEIGH, WINDOW_SIZE } from './const';
import type { LauncherFileSystem } from './filesystem';
import { ICONS_DIRECTORY } from './paths';
import { encodeQuery, setLinkOpenHandlers } from './utils';

const serveURL = serve({ directory: join(__dirname, '..', 'renderer') });

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

const createBrowserWindow = (title: string) =>
  new BrowserWindow({
    frame: false,
    width: WINDOW_SIZE,
    minWidth: WINDOW_SIZE,
    height: WINDOW_SIZE,
    title: title,
    show: false,
    webPreferences: {
      preload: resolve(__dirname, '../preload/admin.js'),
    },
  });

export const setupAppWindows = () => {
  let isQuitting = false;
  // Create the browser window.
  const mainWindow = createBrowserWindow('Holochain Launcher');

  const settingsWindow = createBrowserWindow('Holochain Launcher Settings');

  const icon = nativeImage.createFromPath(path.join(ICONS_DIRECTORY, '16x16.png'));
  const tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      type: 'normal',
      click() {
        mainWindow.show();
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

  loadOrServe(mainWindow, { screen: mainScreen });

  const windows: Record<Screen, BrowserWindow> = {
    [mainScreen]: mainWindow,
    [settingsScreen]: settingsWindow,
  };

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    mainWindow.setSize(WINDOW_SIZE, SEARCH_HEIGH);
    mainWindow.show();
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
  appPort: number | undefined,
): BrowserWindow => {
  // TODO create mapping between installed-app-id's and window ids
  if (!appPort) throw new Error('App port not defined.');
  const appId = extendedAppInfo.appInfo.installed_app_id;
  const holochainDataRoot = extendedAppInfo.holochainDataRoot;
  const partition = `persist:${holochainDataRoot.name}#${appId}`;
  const ses = session.fromPartition(partition);
  ses.protocol.handle('webhapp', async (request) => {
    // console.log("### Got file request: ", request);
    const uriWithoutProtocol = request.url.slice('webhapp://'.length);
    const filePathComponents = uriWithoutProtocol.split('/').slice(1);
    const filePath = join(...filePathComponents);
    const resource = net.fetch(
      url
        .pathToFileURL(join(launcherFileSystem.happUiDir(appId, holochainDataRoot), filePath))
        .toString(),
    );
    if (!filePath.endsWith('index.html')) {
      return resource;
    } else {
      const indexHtmlResponse = await resource;
      const indexHtml = await indexHtmlResponse.text();
      let modifiedContent = indexHtml.replace(
        '<head>',
        `<head><script type="module">window.__HC_LAUNCHER_ENV__ = { APP_INTERFACE_PORT: ${appPort}, INSTALLED_APP_ID: "${appId}", FRAMEWORK: "electron" };</script>`,
      );
      // remove title attribute to be able to set title to app id later
      modifiedContent = modifiedContent.replace(/<title>.*?<\/title>/i, '');
      return new Response(modifiedContent, indexHtmlResponse);
    }
  });
  // Create the browser window.
  const happWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: resolve(__dirname, '../preload/happs.js'),
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
