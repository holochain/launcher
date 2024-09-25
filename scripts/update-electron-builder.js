const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Paths to the files
const launcherConfigJsonPath = path.join(__dirname, '..', 'launcher.config.json');
const electronBuilderYmlPath = path.join(__dirname, '..', 'electron-builder.yml');

// Read package.json
const launcherConfig = JSON.parse(fs.readFileSync(launcherConfigJsonPath, 'utf8'));

// Extract the non-breaking holochain version
const holochainVersion = launcherConfig.binaries.holochain.version.split('.').slice(0, 2).join('.');

// Read electron-builder.yml
const electronBuilderYml = yaml.load(fs.readFileSync(electronBuilderYmlPath, 'utf8'));

// Update the productName
electronBuilderYml.productName = `Holochain Launcher (${holochainVersion})`;

// Write the updated electron-builder.yml back to the file
fs.writeFileSync(electronBuilderYmlPath, yaml.dump(electronBuilderYml), 'utf8');

console.log(
  `Updated productName to "Holochain Launcher (${holochainVersion})" in electron-builder.yml`,
);
