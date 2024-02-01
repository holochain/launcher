import { app } from 'electron';
import fs from 'fs';
import * as path from 'path';

export const DEFAULT_HOLOCHAIN_VERSION = '0.2.5-rc.1-8613839';

const BINARIES_DIRECTORY = app.isPackaged
  ? path.join(app.getAppPath(), '../app.asar.unpacked/resources/bins')
  : path.join(app.getAppPath(), './resources/bins');

const HOLOCHAIN_BINARIES = {
  '0.2.5-rc.1-8613839': path.join(
    BINARIES_DIRECTORY,
    `holochain-v${DEFAULT_HOLOCHAIN_VERSION}${process.platform === 'win32' ? '.exe' : ''}`,
  ),
};

const LAIR_BINARY = path.join(
  BINARIES_DIRECTORY,
  `lair-keystore-v0.4.2${process.platform === 'win32' ? '.exe' : ''}`,
);

export const checkHolochainLairBinariesExist = () =>
  [...Object.values(HOLOCHAIN_BINARIES), LAIR_BINARY].every(fs.existsSync);

export { HOLOCHAIN_BINARIES, LAIR_BINARY };
