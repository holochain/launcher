/* eslint-disable @typescript-eslint/no-var-requires */
import type { AppInfo } from '@holochain/client';
import { AdminWebsocket } from '@holochain/client';
import AdmZip from 'adm-zip';
import * as childProcess from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import getPort from 'get-port';
import * as rustUtils from 'hc-launcher-rust-utils';
import path from 'path';
import split from 'split';

import type { HolochainDataRoot, HolochainPartition, HolochainVersion } from '../types';
import { APP_INSTALLED, HOLOCHAIN_ERROR, HOLOCHAIN_LOG } from '../types';
import { DEFAULT_HOLOCHAIN_VERSION, HOLOCHAIN_BINARIES } from './binaries';
import type { AppMetadata, AppMetadataV1, LauncherFileSystem } from './filesystem';
import { createDirIfNotExists } from './filesystem';
import { type IntegrityChecker } from './integrityChecker';
import type { LauncherEmitter } from './launcherEmitter';
import { breakingVersion } from './utils';

export type AdminPort = number;
export type AppPort = number;

export type UiHashes = Record<string, string>;

const DEFAULT_BOOTSTRAP_SERVER = 'https://bootstrap.holo.host';
const DEFAULT_SIGNALING_SERVER = 'wss://signal.holo.host';
const DEFAULT_RUST_LOG =
  'warn,' +
  // this thrashes on startup
  'wasmer_compiler_cranelift=error,' +
  // this gives a bunch of warnings about how long db accesses are taking, tmi
  'holochain_sqlite::db::access=error,' +
  // this gives a lot of "search_and_discover_peer_connect: no peers found, retrying after delay" messages on INFO
  'kitsune_p2p::spawn::actor::discover=error';
const DEFAULT_WASM_LOG = 'warn';

export class HolochainManager {
  processHandle: childProcess.ChildProcessWithoutNullStreams | undefined;
  adminPort: AdminPort;
  appPort: AppPort;
  adminWebsocket: AdminWebsocket;
  fs: LauncherFileSystem;
  installedApps: AppInfo[];
  launcherEmitter: LauncherEmitter;
  integrityChecker: IntegrityChecker;
  version: HolochainVersion;
  holochainDataRoot: HolochainDataRoot;

  constructor(
    processHandle: childProcess.ChildProcessWithoutNullStreams | undefined,
    launcherEmitter: LauncherEmitter,
    launcherFileSystem: LauncherFileSystem,
    integrityChecker: IntegrityChecker,
    adminPort: AdminPort,
    appPort: AppPort,
    adminWebsocket: AdminWebsocket,
    installedApps: AppInfo[],
    version: HolochainVersion,
    holochainDataRoot: HolochainDataRoot,
  ) {
    this.processHandle = processHandle;
    this.launcherEmitter = launcherEmitter;
    this.integrityChecker = integrityChecker;
    this.adminPort = adminPort;
    this.appPort = appPort;
    this.adminWebsocket = adminWebsocket;
    this.fs = launcherFileSystem;
    this.installedApps = installedApps;
    this.version = version;
    this.holochainDataRoot = holochainDataRoot;
  }

  static async launch(
    launcherEmitter: LauncherEmitter,
    launcherFileSystem: LauncherFileSystem,
    integrityChecker: IntegrityChecker,
    password: string,
    version: HolochainVersion,
    lairUrl: string,
    bootstrapUrl?: string,
    signalingUrl?: string,
    rustLog?: string,
    wasmLog?: string,
    nonDefaultPartition?: HolochainPartition, // launch with data from a non-default partition
  ): Promise<[HolochainManager, HolochainDataRoot]> {
    let holochainDataRoot: HolochainDataRoot;
    switch (nonDefaultPartition?.type) {
      case 'custom':
        holochainDataRoot = {
          type: 'partition',
          name: `partition#${nonDefaultPartition.name}`,
        };
        break;
      case 'external':
        holochainDataRoot = {
          type: 'external',
          name: `external#${nonDefaultPartition.name}`,
          path: nonDefaultPartition.path,
        };
        break;
      default:
        if (version.type !== 'built-in' && !nonDefaultPartition)
          throw new Error('Only built-in holochain binaries can be used in the default partition.');
        holochainDataRoot = {
          type: 'partition',
          name: breakingVersion(
            version.type === 'built-in' ? version.version : DEFAULT_HOLOCHAIN_VERSION,
          ),
        };
        break;
    }

    if (version.type === 'running-external') {
      try {
        // TODO move this logic to where the zome call signer needs to connect.
        // const conductorConfigString = fs.readFileSync(version.configPath, 'utf-8');
        // const lairUrl = conductorConfigString
        //   .replace('connectionUrl:', '')
        //   .trim()
        //   .replaceAll('"', '');
        const adminWebsocket = await AdminWebsocket.connect(
          new URL(`ws://127.0.0.1:${version.adminPort}`),
        );
        console.log(
          `Connected to admin websocket of externally running conductor (port ${version.adminPort}).`,
        );
        const installedApps = await adminWebsocket.listApps({});
        console.log('Installed apps: ', installedApps);
        const appInterfaces = await adminWebsocket.listAppInterfaces();
        console.log('Got appInterfaces: ', appInterfaces);
        let appPort;
        if (appInterfaces.length > 0) {
          appPort = appInterfaces[0];
        } else {
          const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({});
          console.log('Attached app interface port: ', attachAppInterfaceResponse);
          appPort = attachAppInterfaceResponse.port;
        }
        return [
          new HolochainManager(
            undefined,
            launcherEmitter,
            launcherFileSystem,
            integrityChecker,
            version.adminPort,
            appPort,
            adminWebsocket,
            installedApps,
            version,
            holochainDataRoot,
          ),
          holochainDataRoot,
        ];
      } catch (e) {
        throw new Error(`Failed to connect to external holochain binary: ${JSON.stringify(e)}`);
      }
    }
    const partitionName = holochainDataRoot.name;

    createDirIfNotExists(path.join(launcherFileSystem.holochainDir, partitionName));

    const adminPort = await getPort();

    const conductorEnvironmentPath = launcherFileSystem.conductorEnvironmentDir(partitionName);
    const configPath = launcherFileSystem.conductorConfigPath(partitionName);
    console.log('configPath: ', configPath);
    const configExists = fs.existsSync(configPath);

    const overwriteConfig = () =>
      rustUtils.overwriteConfig(adminPort, lairUrl, undefined, undefined, configPath);

    const defaultConductorConfig = () =>
      rustUtils.defaultConductorConfig(
        adminPort,
        lairUrl,
        bootstrapUrl || DEFAULT_BOOTSTRAP_SERVER,
        signalingUrl || DEFAULT_SIGNALING_SERVER,
        conductorEnvironmentPath,
      );

    const conductorConfig = configExists ? overwriteConfig() : defaultConductorConfig();
    const action = configExists ? 'Overwriting' : 'Writing';
    console.log(`${action} new conductor-config.yaml...`);

    try {
      fs.writeFileSync(configPath, conductorConfig);
    } catch (err) {
      throw new Error(`Failed to write to file: ${JSON.stringify(err)}`);
    }

    const binary = version.type === 'built-in' ? HOLOCHAIN_BINARIES[version.version] : version.path;
    const conductorHandle = childProcess.spawn(binary, ['-c', configPath, '-p'], {
      env: {
        RUST_LOG: rustLog || DEFAULT_RUST_LOG,
        WASM_LOG: wasmLog || DEFAULT_WASM_LOG,
      },
    });
    conductorHandle.stdin.write(password);
    conductorHandle.stdin.end();
    conductorHandle.stdout.pipe(split()).on('data', async (line: string) => {
      launcherEmitter.emit(HOLOCHAIN_LOG, {
        version,
        holochainDataRoot,
        data: line,
      });
    });
    conductorHandle.stderr.pipe(split()).on('data', (line: string) => {
      launcherEmitter.emit(HOLOCHAIN_ERROR, {
        version,
        holochainDataRoot,
        data: line,
      });
    });

    return new Promise((resolve, reject) => {
      conductorHandle.stdout.pipe(split()).on('data', async (line: string) => {
        if (line.includes('FATAL PANIC PanicInfo')) {
          reject(
            `Holochain version ${JSON.stringify(
              version,
            )} failed to start up and crashed. Check the logs for details.`,
          );
        }
        if (line.includes('Conductor ready.')) {
          const adminWebsocket = await AdminWebsocket.connect(
            new URL(`ws://127.0.0.1:${adminPort}`),
          );
          console.log('Connected to admin websocket.');
          const installedApps = await adminWebsocket.listApps({});
          const appInterfaces = await adminWebsocket.listAppInterfaces();
          console.log('Got appInterfaces: ', appInterfaces);
          let appPort;
          if (appInterfaces.length > 0) {
            appPort = appInterfaces[0];
          } else {
            const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({});
            console.log('Attached app interface port: ', attachAppInterfaceResponse);
            appPort = attachAppInterfaceResponse.port;
          }
          resolve([
            new HolochainManager(
              conductorHandle,
              launcherEmitter,
              launcherFileSystem,
              integrityChecker,
              adminPort,
              appPort,
              adminWebsocket,
              installedApps,
              version,
              holochainDataRoot,
            ),
            holochainDataRoot,
          ]);
        }
      });
    });
  }

  // TODO Add option to install happ without UI
  async installWebHapp(webHappPath: string, appId: string, networkSeed?: string) {
    // Decode webhapp into .happ bytes and ui.zip bytes
    // TODO Option to install headless app
    const happAndUiBytes = await rustUtils.readAndDecodeWebhapp(webHappPath);

    // write [sha256].happ to happs directory
    const happHasher = crypto.createHash('sha256');
    const happSha256 = happHasher.update(Buffer.from(happAndUiBytes.happBytes)).digest('hex');
    const happFilePath = path.join(this.fs.happsDir(this.holochainDataRoot), `${happSha256}.happ`);
    writeFile(happFilePath, Buffer.from(happAndUiBytes.happBytes));

    // compute UI hash
    const uiZipHasher = crypto.createHash('sha256');
    const uiZipSha256 = uiZipHasher.update(Buffer.from(happAndUiBytes.uiBytes)).digest('hex');

    const uiDir = path.join(this.fs.uisDir(this.holochainDataRoot), uiZipSha256);
    // here we assume that if the uiDir exists, the hashes.json exists as well.
    if (!fs.existsSync(path.join(uiDir, 'assets'))) {
      fs.mkdirSync(uiDir, { recursive: true });

      const hashes: Record<string, string> = {};
      const zip = new AdmZip(Buffer.from(happAndUiBytes.uiBytes));
      zip.getEntries().forEach((entry) => {
        // console.log(entry.entryName);
        const hasher = crypto.createHash('sha256');
        const data = entry.getData();
        hasher.update(data);
        const hash = hasher.digest('hex');
        hashes[entry.entryName] = hash;
      });

      this.integrityChecker.storeToSignedJSON(path.join(uiDir, 'hashes.json'), hashes);
      zip.extractAllTo(path.join(uiDir, 'assets'));
    }

    // install happ file into conductor
    const pubKey = await this.adminWebsocket.generateAgentPubKey();
    const appInfo = await this.adminWebsocket.installApp({
      agent_key: pubKey,
      installed_app_id: appId,
      membrane_proofs: {},
      path: happFilePath,
      network_seed: networkSeed,
    });

    // store app metadata to installed app directory
    const metaData: AppMetadata<AppMetadataV1> = {
      formatVersion: 1,
      data: {
        type: 'webhapp',
        happ: {
          sha256: happSha256,
        },
        ui: {
          location: {
            type: 'filesystem',
            sha256: uiZipSha256,
          },
        },
      },
    };

    if (!fs.existsSync(this.fs.appMetadataDir(appId, this.holochainDataRoot))) {
      fs.mkdirSync(this.fs.appMetadataDir(appId, this.holochainDataRoot), { recursive: true });
    }

    // TODO potentially back up existing one to allow for undoing updates
    this.integrityChecker.storeToSignedJSON(
      path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
      metaData,
    );

    await this.adminWebsocket.enableApp({ installed_app_id: appId });
    const installedApps = await this.adminWebsocket.listApps({});
    // console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
    this.launcherEmitter.emit(APP_INSTALLED, {
      version: this.version,
      holochainDataRoot: this.holochainDataRoot,
      data: appInfo,
    });
  }

  async installHeadlessHapp(
    happPath: string,
    appId: string,
    happSha256: string,
    networkSeed?: string,
  ) {
    const pubKey = await this.adminWebsocket.generateAgentPubKey();
    const appInfo = await this.adminWebsocket.installApp({
      agent_key: pubKey,
      installed_app_id: appId,
      membrane_proofs: {},
      path: happPath,
      network_seed: networkSeed,
    });

    // store app metadata to installed app directory
    const metaData: AppMetadata<AppMetadataV1> = {
      formatVersion: 1,
      data: {
        type: 'headless',
        happ: {
          sha256: happSha256,
        },
      },
    };

    if (!fs.existsSync(this.fs.appMetadataDir(appId, this.holochainDataRoot))) {
      fs.mkdirSync(this.fs.appMetadataDir(appId, this.holochainDataRoot), { recursive: true });
    }

    this.integrityChecker.storeToSignedJSON(
      path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
      metaData,
    );

    await this.adminWebsocket.enableApp({ installed_app_id: appId });
    console.log('Insalled app.');
    const installedApps = await this.adminWebsocket.listApps({});
    // console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
    this.launcherEmitter.emit(APP_INSTALLED, {
      version: this.version,
      holochainDataRoot: this.holochainDataRoot,
      data: appInfo,
    });
  }

  async uninstallApp(appId: string) {
    await this.adminWebsocket.uninstallApp({ installed_app_id: appId });
    fs.rmSync(this.fs.appMetadataDir(appId, this.holochainDataRoot), { recursive: true });
    console.log('Uninstalled app.');
    const installedApps = await this.adminWebsocket.listApps({});
    console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;

    // TODO Potentially remove .happ file and ui directory in case it is not used by any
    // other app instance anymore. This would mean however that happ and UI would need
    // to be fetched over the network again if the same happ and UI shall be installed
    // at a later time
  }
}

function writeFile(filePath: string, contents: string | NodeJS.ArrayBufferView): void {
  const dirname = path.dirname(filePath);
  fs.mkdirSync(dirname, { recursive: true });
  fs.writeFileSync(filePath, contents);
}
