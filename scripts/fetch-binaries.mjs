import * as fs from 'fs';
import https from 'https';
import * as path from 'path';

const packageJSON = fs.readFileSync('package.json');
const packageJson = JSON.parse(packageJSON);

const binariesDir = path.join('resources', 'bins');

// Ensure the binaries directory exists
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

fs.mkdirSync(binariesDir, { recursive: true });

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

const holochainBinaryFilename = `holochain-v${packageJson.binaries.holochain}${
  process.platform === 'win32' ? '.exe' : ''
}`;

const lairBinaryFilename = `lair-keystore-v${packageJson.binaries.lair_keystore}${
  process.platform === 'win32' ? '.exe' : ''
}`;

function downloadHolochainBinary() {
  const holochainBinaryRemoteFilename = `holochain-v${packageJson.binaries.holochain}-${targetEnding}`;
  const holochainBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/holochain-binaries-${packageJson.binaries.holochain}/${holochainBinaryRemoteFilename}`;

  const destinationPath = path.join(binariesDir, holochainBinaryFilename);

  const file = fs.createWriteStream(destinationPath);
  console.log('Fetching holochain binary from ', holochainBinaryUrl);
  https
    .get(holochainBinaryUrl, (response) => {
      if (response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, (redirectResponse) => {
          redirectResponse.pipe(file);
        });
      } else if (response.statusCode === 404) {
        throw new Error('No binary found at the given URL');
      } else {
        response.pipe(file);
      }

      file.on('finish', () => {
        file.close(() => {
          console.log('Holochain binary saved successfully.');
        });
      });

      fs.chmodSync(destinationPath, 511);
    })
    .on('error', (err) => {
      fs.unlink(destinationPath);
      console.error(err.message);
    });
}

function downloadLairBinary() {
  const lairBinaryRemoteFilename = `lair-keystore-v${packageJson.binaries.lair_keystore}-${targetEnding}`;
  const lairBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/lair-binaries-${packageJson.binaries.lair_keystore}/${lairBinaryRemoteFilename}`;

  const destinationPath = path.join(binariesDir, lairBinaryFilename);

  const file = fs.createWriteStream(destinationPath);
  console.log('Fetching lair binary from ', lairBinaryUrl);
  https
    .get(lairBinaryUrl, (response) => {
      if (response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, (redirectResponse) => {
          redirectResponse.pipe(file);
        });
      } else if (response.statusCode === 404) {
        throw new Error('No binary found at the given URL');
      } else {
        response.pipe(file);
      }

      file.on('finish', () => {
        file.close(() => {
          console.log('Lair binary saved successfully.');
        });
      });

      fs.chmodSync(destinationPath, 511);
    })
    .on('error', (err) => {
      fs.unlink(destinationPath);
      console.error(err.message);
    });
}

downloadHolochainBinary();
downloadLairBinary();
