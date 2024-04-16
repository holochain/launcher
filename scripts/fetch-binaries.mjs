import * as fs from 'fs';
import https from 'https';
import * as path from 'path';

const packageJSON = fs.readFileSync('package.json');
const packageJson = JSON.parse(packageJSON);

const binariesDir = path.join('resources', 'bins');

const holochainRemoteFilenames = {
  win32: `holochain-v${packageJson.binaries.holochain}-x86_64-pc-windows-msvc.exe `,
  darwin: `holochain-v${packageJson.binaries.holochain}-x86_64-apple-darwin `,
  linux: `holochain-v${packageJson.binaries.holochain}-x86_64-unknown-linux-gnu`,
};

const holochainBinaryFilename = `holochain-v${packageJson.binaries.holochain}${
  process.platform === 'win32' ? '.exe' : ''
}`;

const lairRemoteFilenames = {
  win32: `lair-keystore-v${packageJson.binaries.lair_keystore}-x86_64-pc-windows-msvc.exe `,
  darwin: `lair-keystore-v${packageJson.binaries.lair_keystore}-x86_64-apple-darwin `,
  linux: `lair-keystore-v${packageJson.binaries.lair_keystore}-x86_64-unknown-linux-gnu`,
};

const lairBinaryFilename = `lair-keystore-v${packageJson.binaries.lair_keystore}${
  process.platform === 'win32' ? '.exe' : ''
}`;

function downloadHolochainBinary() {
  const holochainBinaryRemoteFilename = holochainRemoteFilenames[process.platform];
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
  const lairBinaryRemoteFilename = lairRemoteFilenames[process.platform];
  const lairBinaryUrl = `https://github.com/matthme/holochain-binaries/releases/download/lair-binaries-${packageJson.binaries.lair_keystore}/${lairBinaryRemoteFilename}`;

  const destinationPath = path.join(binariesDir, lairBinaryFilename);

  const file = fs.createWriteStream(destinationPath);
  console.log('Fetching lair binary from ', lairBinaryFilename);
  https
    .get(lairBinaryUrl, (response) => {
      if (response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, (redirectResponse) => {
          redirectResponse.pipe(file);
        });
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
