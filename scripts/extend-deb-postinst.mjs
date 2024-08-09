/**
 * This script extends the deb postinst script with the creation of an apparmor profile
 * on Ubuntu 24.04 (https://github.com/electron/electron/issues/41066), repackages
 * the deb file and then overwrites the latest-linux.yaml file with the new sha256 hash
 */
import yaml  from 'js-yaml';
import fs from 'fs';
import crypto from 'crypto';
import child_process from 'child_process';

const electronBuilderYaml = yaml.load(fs.readFileSync("electron-builder.yml", 'utf-8'));
const packageJson = JSON.parse(fs.readFileSync('package.json'));
const launcherAppId = electronBuilderYaml.appId;
const launcherProductName = electronBuilderYaml.productName;
const launcherVersion = packageJson.version;
const debFileName = `${launcherAppId}_${launcherVersion}_amd64.deb`;
const debFilePath = `dist/${debFileName}`;

const fileBytesBefore = fs.readFileSync(debFilePath);
const hasher1 = crypto.createHash('sha512');
hasher1.update(fileBytesBefore);
const sha512_before = hasher1.digest('base64');
console.log("sha512 before modification: ", sha512_before);
console.log("fileSize before modification: ", fileBytesBefore.length);

const unpackDirectory = `dist/modified-deb`;
console.log("Unpacking deb file for subsequent modification. This may take a while...");
const stdout = child_process.execSync(`dpkg-deb -R ${debFilePath} ${unpackDirectory}`);
console.log(".deb file unpacked.");

// Modify the postinst script
const posinstPath = `${unpackDirectory}/DEBIAN/postinst`;
const postinstScript = fs.readFileSync(posinstPath, 'utf-8');
const postinstScriptModified = postinstScript.replace("# SUID chrome-sandbox for Electron 5+", `
if [ -e /etc/lsb-release ]; then

  while IFS='=' read -r key value

  do
    if [ "$key" == "DISTRIB_RELEASE" ]; then
       release_version=$value
    fi
  done < /etc/lsb-release

  if [ $release_version == "24.04" ]; then

  # chown the sandbox on Ubuntu 24.04
  chown root '/opt/${launcherProductName}/chrome-sandbox' || true

  # add AppArmor profile on Ubuntu 24.04
  profile_content="# This profile allows everything and only exists to give the
# application a name instead of having the label "unconfined"

abi <abi/4.0>,
include <tunables/global>

profile ${launcherAppId} \\"/opt/${launcherProductName}/${launcherAppId}\\" flags=(unconfined) {
  userns,

  # Site-specific additions and overrides. See local/README for details.
  include if exists <local/${launcherAppId}>
}"

    echo "$profile_content" > /etc/apparmor.d/${launcherAppId}

    systemctl reload apparmor.service

  fi

fi


# SUID chrome-sandbox for Electron 5+
`);

fs.writeFileSync(posinstPath, postinstScriptModified);

console.log("Wrote modified postinst script: ", postinstScriptModified);


// Package modified .deb file
console.log("Re-packaging modified deb file...")
const stdout2 = child_process.execSync(`dpkg-deb -b ${unpackDirectory} ${debFilePath}`);
console.log("Modified deb file packaged.");


// Modify  sha512 hashes of latest-linux.yaml
const fileBytes = fs.readFileSync(debFilePath);
const hasher = crypto.createHash('sha512');
hasher.update(fileBytes);
const sha512 = hasher.digest('base64');

const latestYaml = yaml.load(fs.readFileSync('dist/latest-linux.yml'));

console.log("latestYaml before modification:\n", latestYaml);

const files = latestYaml.files.filter((file) => file.url !== debFileName);
files.push({
  url: debFileName,
  sha512,
  size: fileBytes.length,
});

latestYaml.files = files;

console.log('\n\nsha512: ', sha512);
console.log("\n\nlatestYaml after modification: ", latestYaml);

fs.writeFileSync('latest-linux.yml', yaml.dump(latestYaml, { lineWidth: -1 }), 'utf-8');