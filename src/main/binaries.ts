import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import { breakingVersion } from './utils';

const appPath = app.getAppPath();
// const getFilePath = (relativePath: string) => path.join(app.getAppPath(), relativePath);

// const getPackageJSONPath = () =>
//   getFilePath(app.isPackaged ? '../app.asar.unpacked/package.json' : './package.json');

const launcherConfigPath = path.join(appPath, 'launcher.config.json');
const launcherConfig = JSON.parse(fs.readFileSync(launcherConfigPath, 'utf-8'));

const DEFAULT_HOLOCHAIN_VERSION = launcherConfig.binaries.holochain.version;
const DEFAULT_LAIR_KEYSTORE_VERSION = launcherConfig.binaries.lair.version;
export const BREAKING_DEFAULT_HOLOCHAIN_VERSION = breakingVersion(DEFAULT_HOLOCHAIN_VERSION);

const BINARIES_DIRECTORY = app.isPackaged
  ? path.join(appPath, '../app.asar.unpacked/resources/bins')
  : path.join(appPath, './resources/bins');

const HOLOCHAIN_BINARIES = {
  [DEFAULT_HOLOCHAIN_VERSION]: path.join(
    BINARIES_DIRECTORY,
    `holochain-v${DEFAULT_HOLOCHAIN_VERSION}-${launcherConfig.binariesAppendix}${process.platform === 'win32' ? '.exe' : ''}`,
  ),
};

const LAIR_BINARY = path.join(
  BINARIES_DIRECTORY,
  `lair-keystore-v${DEFAULT_LAIR_KEYSTORE_VERSION}-${launcherConfig.binariesAppendix}${process.platform === 'win32' ? '.exe' : ''}`,
);

const checkHolochainLairBinariesExist = () =>
  [...Object.values(HOLOCHAIN_BINARIES), LAIR_BINARY].every(fs.existsSync);

export {
  checkHolochainLairBinariesExist,
  DEFAULT_HOLOCHAIN_VERSION,
  DEFAULT_LAIR_KEYSTORE_VERSION,
  HOLOCHAIN_BINARIES,
  LAIR_BINARY,
};
