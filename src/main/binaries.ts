import { app } from 'electron';
import fs from 'fs';
import { readFileSync } from 'fs';
import * as path from 'path';

import { HolochainLairVersionSchema } from '$shared/types';

import { breakingVersion } from './utils';

const getFilePath = (relativePath: string) => path.join(app.getAppPath(), relativePath);

const getPackageJSONPath = () =>
  getFilePath(app.isPackaged ? '../app.asar.unpacked/package.json' : './package.json');

const packageJSON = JSON.parse(readFileSync(getPackageJSONPath(), 'utf8'));

const HolochainLairVersion = HolochainLairVersionSchema.parse(packageJSON);

const DEFAULT_HOLOCHAIN_VERSION = HolochainLairVersion.binaries.holochain;
const DEFAULT_LAIR_KEYSTORE_VERSION = HolochainLairVersion.binaries.lair_keystore;
export const BREAKING_DEFAULT_HOLOCHAIN_VERSION = breakingVersion(DEFAULT_HOLOCHAIN_VERSION);

const BINARIES_DIRECTORY = getFilePath(
  app.isPackaged ? '../app.asar.unpacked/resources/bins' : './resources/bins',
);

const HOLOCHAIN_BINARIES = {
  [DEFAULT_HOLOCHAIN_VERSION]: path.join(
    BINARIES_DIRECTORY,
    `holochain-v${DEFAULT_HOLOCHAIN_VERSION}${packageJSON.name.replace('holochain', '')}${process.platform === 'win32' ? '.exe' : ''}`,
  ),
};

const LAIR_BINARY = path.join(
  BINARIES_DIRECTORY,
  `lair-keystore-v${DEFAULT_LAIR_KEYSTORE_VERSION}${packageJSON.name.replace('holochain', '')}${process.platform === 'win32' ? '.exe' : ''}`,
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
