/**
 * This scripts creates a latest.yaml file from the setup.exe file. Used after code
 * signing of the original setup.exe file
 */

const yaml = require('js-yaml');
const fs = require('fs');
const crypto = require('crypto');

// read version number from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json'));

const exeFileName = `${packageJson.name}-${packageJson.version}-setup.exe`;

const exeFileLocation = `dist/${exeFileName}`;

console.log('exeFileLocation: ', exeFileLocation);

const fileBytes = fs.readFileSync(exeFileLocation);
const hasher = crypto.createHash('sha512');
hasher.update(fileBytes);
const sha512 = hasher.digest('base64');

const latestYaml = {
  version: packageJson.version,
  files: [
    {
      url: exeFileName,
      sha512,
      size: fileBytes.length,
    },
  ],
  path: exeFileName,
  sha512,
  releaseDate: new Date(Date.now()).toISOString(),
};

console.log('sha512: ', sha512);
console.log('modified latest.yaml: ', latestYaml);

fs.writeFileSync('latest.yml', yaml.dump(latestYaml, { lineWidth: -1 }), 'utf-8');
