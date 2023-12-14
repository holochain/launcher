import { app } from 'electron';
import * as path from 'path';

const binariesDirectory = app.isPackaged
  ? path.join(app.getAppPath(), '../app.asar.unpacked/resources/bins')
  : path.join(app.getAppPath(), './resources/bins');

const holochianBinaries = {
  'holochain-0.2.3': path.join(
    binariesDirectory,
    `holochain-v0.2.3${process.platform === 'win32' ? '.exe' : ''}`,
  ),
};

const lairBinary = path.join(
  binariesDirectory,
  `lair-keystore-v0.3.0${process.platform === 'win32' ? '.exe' : ''}`,
);

export { holochianBinaries, lairBinary };
