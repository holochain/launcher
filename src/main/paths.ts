import { app } from 'electron';
import path from 'path';

export const ICONS_DIRECTORY = app.isPackaged
  ? path.join(app.getAppPath(), '../app.asar.unpacked/resources/icons')
  : path.join(app.getAppPath(), './resources/icons');

export const DEFAULT_APPS_DIRECTORY = app.isPackaged
  ? path.join(app.getAppPath(), '../app.asar.unpacked/resources/default-apps')
  : path.join(app.getAppPath(), './resources/default-apps');
