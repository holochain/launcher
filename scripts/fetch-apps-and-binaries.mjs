import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';

const launcherConfigJSON = fs.readFileSync('launcher.config.json');
const launcherConfig = JSON.parse(launcherConfigJSON);

const binariesDir = path.join('resources', 'bins');
const defaultAppsDir = path.join('resources', 'default-apps');

// Ensure the binaries directory exists
if (!fs.existsSync(binariesDir)) {
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

// Download holochain binary
const holochainBinaryFilename = `holochain-v${launcherConfig.binaries.holochain.version}-${launcherConfig.binariesAppendix}${
  process.platform === 'win32' ? '.exe' : ''
}`;
const holochainBinaryRemoteFilename = `holochain-v${launcherConfig.binaries.holochain.version}-${targetEnding}`;
const holochainBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/holochain-binaries-${launcherConfig.binaries.holochain.version}/${holochainBinaryRemoteFilename}`;

console.log("Downloading holochain binary");
downloadFile(
  holochainBinaryUrl,
  path.join(binariesDir, holochainBinaryFilename),
  launcherConfig.binaries.holochain.sha256[targetEnding],
  true,
);

// Download lair binary
const lairBinaryFilename = `lair-keystore-v${launcherConfig.binaries.lair.version}-${launcherConfig.binariesAppendix}${
  process.platform === 'win32' ? '.exe' : ''
}`;

const lairBinaryRemoteFilename = `lair-keystore-v${launcherConfig.binaries.lair.version}-${targetEnding}`;
const lairBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/lair-binaries-${launcherConfig.binaries.lair.version}/${lairBinaryRemoteFilename}`;

console.log("Downloading lair binary");
downloadFile(
  lairBinaryUrl,
  path.join(binariesDir, lairBinaryFilename),
  launcherConfig.binaries.lair.sha256[targetEnding],
  true,
);

// Download default apps
for (const defaultApp of Object.keys(launcherConfig.defaultApps)) {
  const url = launcherConfig.defaultApps[defaultApp].url;
  const sha256 = launcherConfig.defaultApps[defaultApp].sha256;
  const destinationPath = path.join(defaultAppsDir, `${defaultApp}.happ`);
  console.log("Downloading default app ", defaultApp);
  downloadFile(url, destinationPath, sha256, false);
}



function downloadFile(url, targetPath, expectedSha256Hex, chmod = false) {
  console.log('Downloading from ', url);
  exec(`curl -f -L --output ${targetPath} ${url}`, (error, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
      throw new Error('Failed to fetch resource.');
    } else {
      const fileBytes = fs.readFileSync(targetPath);
      const hasher = crypto.createHash('sha256');
      hasher.update(fileBytes);
      const sha256Hex = hasher.digest('hex');
      if (sha256Hex !== expectedSha256Hex)
        throw new Error(
          `sha256 does not match the expected sha256. Got ${sha256Hex} but expected ${expectedSha256Hex}`,
        );

      console.log(`Download to '${targetPath}' successful. sha256 of file (hex): ${sha256Hex}`);
      if (chmod) {
        fs.chmodSync(targetPath, 511);
        console.log('Gave executable permission to file.');
      }
    }
  });
}