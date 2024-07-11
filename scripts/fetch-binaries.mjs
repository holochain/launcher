import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { downloadFile } from './utils.mjs';

const packageJSON = readFileSync('package.json');
const packageJson = JSON.parse(packageJSON);

const binariesDir = join('resources', 'bins');

// Ensure the binaries directory exists
if (!existsSync(binariesDir)) {
  mkdirSync(binariesDir, { recursive: true });
}

let targetEnding;
switch (process.platform) {
  case 'linux':
    targetEnding = 'x86_64-unknown-linux-gnu';
    break;
  case 'win32':
    targetEnding = 'x86_64-pc-windows-msvc.exe';
    break;
  case 'darwin':
    switch (process.arch) {
      case 'arm64':
        targetEnding = 'aarch64-apple-darwin';
        break;
      case 'x64':
        targetEnding = 'x86_64-apple-darwin';
        break;
      default:
        throw new Error(`Got unexpected macOS architecture: ${process.arch}`);
    }
    break;
  default:
    throw new Error(`Got unexpected OS platform: ${process.platform}`);
}

const holochainBinaryFilename = `holochain-v${packageJson.binaries.holochain}${packageJson.name.replace('holochain', '')}${
  process.platform === 'win32' ? '.exe' : ''
}`;

const lairBinaryFilename = `lair-keystore-v${packageJson.binaries.lair_keystore}${packageJson.name.replace('holochain', '')}${
  process.platform === 'win32' ? '.exe' : ''
}`;

const holochainBinaryRemoteFilename = `holochain-v${packageJson.binaries.holochain}-${targetEnding}`;
const holochainBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/holochain-binaries-${packageJson.binaries.holochain}/${holochainBinaryRemoteFilename}`;

const lairBinaryRemoteFilename = `lair-keystore-v${packageJson.binaries.lair_keystore}-${targetEnding}`;
const lairBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/lair-binaries-${packageJson.binaries.lair_keystore}/${lairBinaryRemoteFilename}`;

const downloadAllBinaries = async () => {
  const downloadPromises = [
    downloadFile(holochainBinaryUrl, binariesDir, holochainBinaryFilename),
    downloadFile(lairBinaryUrl, binariesDir, lairBinaryFilename),
  ];

  await Promise.all(downloadPromises);
};

const main = async () => {
  try {
    await downloadAllBinaries();
    // Add a small delay to ensure all file operations are complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Operation completed successfully.');
  } catch (err) {
    console.error('Error downloading binaries:', err);
    process.exit(1);
  }
};

main();