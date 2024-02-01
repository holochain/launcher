import { app } from 'electron';
import fs from 'fs';
import { readFileSync } from 'fs';
import * as path from 'path';

import { HolochainLairVersionSchema } from '../types';

const getFilePath = (relativePath) => path.join(app.getAppPath(), relativePath);

const getPackageJSONPath = () =>
  getFilePath(app.isPackaged ? '../app.asar.unpacked/package.json' : './package.json');

const readJSONFile = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const packageJSON = readJSONFile(getPackageJSONPath());

const HolochainLairVersion = HolochainLairVersionSchema.parse(packageJSON);

export const DEFAULT_HOLOCHAIN_VERSION = HolochainLairVersion.binaries.holochain;
export const DEFAULT_LAIR_KEYSTORE_VERSION = HolochainLairVersion.binaries.lair_keystore;

const BINARIES_DIRECTORY = getFilePath(
  app.isPackaged ? '../app.asar.unpacked/resources/bins' : './resources/bins',
);

const HOLOCHAIN_BINARIES = {
  DEFAULT_HOLOCHAIN_VERSION: path.join(
    BINARIES_DIRECTORY,
    `holochain-v${DEFAULT_HOLOCHAIN_VERSION}${process.platform === 'win32' ? '.exe' : ''}`,
  ),
};

const LAIR_BINARY = path.join(
  BINARIES_DIRECTORY,
  `lair-keystore-v${DEFAULT_LAIR_KEYSTORE_VERSION}${process.platform === 'win32' ? '.exe' : ''}`,
);

export const checkHolochainLairBinariesExist = () =>
  [...Object.values(HOLOCHAIN_BINARIES), LAIR_BINARY].every(fs.existsSync);

export { HOLOCHAIN_BINARIES, LAIR_BINARY };
