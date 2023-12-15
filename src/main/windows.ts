import { is } from '@electron-toolkit/utils';
import { BrowserWindow, net, session } from 'electron';
import { createIPCHandler } from 'electron-trpc/main';
import path from 'path';
import url from 'url';

import { ExtendedAppInfo } from '../types';
import type { AppRouter } from '.';
import { LauncherFileSystem } from './filesystem';
import { setLinkOpenHandlers } from './utils';

export const createOrShowMainWindow = (
  mainWindow: BrowserWindow | undefined | null,
  router: AppRouter,
) => {
  if (mainWindow) {
    mainWindow.show();
    return;
  }
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Holochain Launcher',
    show: false,
    webPreferences: {
      preload: path.resolve(__dirname, '../preload/admin.js'),
    },
  });

  createIPCHandler({ router, windows: [mainWindow] });

  console.log('Creating main window');

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.

  if (is.dev) {
    mainWindow.loadURL(`http://localhost:5173`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // once its ready to show, show
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
    // Open the DevTools.
    if (is.dev) {
      mainWindow!.webContents.openDevTools();
    }
  });

  setLinkOpenHandlers(mainWindow);

  console.log('Content loaded into main window.');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  return mainWindow;
};

export const createHappWindow = (
  extendedAppInfo: ExtendedAppInfo,
  launcherFileSystem: LauncherFileSystem,
  appPort: number | undefined,
): BrowserWindow => {
  // TODO create mapping between installed-app-id's and window ids
  if (!appPort) throw new Error('App port not defined.');
  const appId = extendedAppInfo.appInfo.installed_app_id;
  const holochainPartition = extendedAppInfo.partition;
  const partition = `persist:${holochainPartition}#${appId}`;
  const ses = session.fromPartition(partition);
  ses.protocol.handle('webhapp', async (request) => {
    // console.log("### Got file request: ", request);
    const uriWithoutProtocol = request.url.slice('webhapp://'.length);
    const filePathComponents = uriWithoutProtocol.split('/').slice(1);
    const filePath = path.join(...filePathComponents);
    const resource = net.fetch(
      url
        .pathToFileURL(path.join(launcherFileSystem.happUiDir(appId, holochainPartition), filePath))
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
  let happWindow = new BrowserWindow({
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
