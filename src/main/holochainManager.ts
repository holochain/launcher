import { platform } from '@electron-toolkit/utils';
import type {
  ActionHashB64,
  AgentPubKey,
  AgentPubKeyB64,
  AppAuthenticationToken,
  AppInfo,
  InstallAppRequest,
  InstalledAppId,
  MembraneProof,
} from '@holochain/client';
import { AdminWebsocket, decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
import AdmZip from 'adm-zip';
import * as childProcess from 'child_process';
import crypto from 'crypto';
import { app, session } from 'electron';
import fs from 'fs';
import getPort from 'get-port';
import { type HappAndUiBytes } from 'hc-launcher-rust-utils';
import * as rustUtils from 'hc-launcher-rust-utils';
import path from 'path';
import split from 'split';

import type {
  DistributionInfoV1,
  HolochainDataRoot,
  HolochainPartition,
  HolochainVersion,
} from '$shared/types';
import {
  APP_INSTALLED,
  HOLOCHAIN_ERROR,
  HOLOCHAIN_LOG,
  LAUNCHER_ERROR,
  REFETCH_DATA_IN_ALL_WINDOWS,
} from '$shared/types';

import { DEFAULT_HOLOCHAIN_VERSION, HOLOCHAIN_BINARIES } from './binaries';
import { APP_ALREADY_INSTALLED_ERROR, DUPLICATE_PUBKEY_ERROR_MESSAGE } from './const';
import type { AppMetadata, AppMetadataV1, LauncherFileSystem } from './filesystem';
import { createDirIfNotExists } from './filesystem';
import { type IntegrityChecker } from './integrityChecker';
import type { LauncherEmitter } from './launcherEmitter';
import { breakingVersion, happSessionName } from './utils';

export type AdminPort = number;
export type AppPort = number;

export type UiHashes = Record<string, string>;

const DEFAULT_BOOTSTRAP_SERVER = 'https://bootstrap-0.infra.holochain.org';
const DEFAULT_SIGNALING_SERVER = 'wss://sbd-0.main.infra.holo.host';
const DEFAULT_ICE_SERVERS = [
  'stun:stun-0.main.infra.holo.host:443',
  'stun:stun-1.main.infra.holo.host:443',
];
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
  appTokens: Record<InstalledAppId, AppAuthenticationToken> = {};

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
    iceUrls?: Array<string>,
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
        const adminWebsocket = await AdminWebsocket.connect({
          url: new URL(`ws://localhost:${version.adminPort}`),
          wsClientOptions: {
            origin: 'holochain-launcher',
          },
        });
        console.log(
          `Connected to admin websocket of externally running conductor (port ${version.adminPort}).`,
        );
        const installedApps = await adminWebsocket.listApps({});
        console.log('Installed apps: ', installedApps);
        const appInterfaces = await adminWebsocket.listAppInterfaces();
        console.log('Got appInterfaces: ', appInterfaces);

        const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({
          allowed_origins: app.isPackaged
            ? 'app://-,webhapp://webhappwindow,holochain-launcher'
            : 'http://localhost:5173,webhapp://webhappwindow,holochain-launcher',
        });
        console.log('Attached app interface port: ', attachAppInterfaceResponse);
        const appPort = attachAppInterfaceResponse.port;

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
      rustUtils.overwriteConfig(
        adminPort,
        lairUrl,
        bootstrapUrl || DEFAULT_BOOTSTRAP_SERVER,
        signalingUrl || DEFAULT_SIGNALING_SERVER,
        configPath,
        'holochain-launcher',
        iceUrls || DEFAULT_ICE_SERVERS,
      );

    const defaultConductorConfig = () =>
      rustUtils.defaultConductorConfig(
        adminPort,
        lairUrl,
        bootstrapUrl || DEFAULT_BOOTSTRAP_SERVER,
        signalingUrl || DEFAULT_SIGNALING_SERVER,
        conductorEnvironmentPath,
        'holochain-launcher',
        false,
        iceUrls || DEFAULT_ICE_SERVERS,
      );

    const conductorConfig = configExists ? overwriteConfig() : defaultConductorConfig();

    console.log('Generated conductor config: ', conductorConfig);
    const action = configExists ? 'Partially overwriting' : 'Writing new';
    console.log(`${action} conductor-config.yaml...`);

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
        NO_COLOR: '1',
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
      const handleError = (error: unknown) => {
        console.error(error);
        conductorHandle.kill();
        reject(error);
      };

      conductorHandle.stderr.pipe(split()).on('data', async (line: string) => {
        if (line.includes('holochain had a problem and crashed')) {
          handleError(
            `Holochain version ${JSON.stringify(
              version,
            )} failed to start up and crashed. Check the logs for details.`,
          );
        }
      });
      conductorHandle.stdout.pipe(split()).on('data', async (line: string) => {
        if (line.includes('could not be parsed, because it is not valid YAML')) {
          handleError(
            `Holochain version ${JSON.stringify(
              version,
            )} failed to start up. Check the logs for details.`,
          );
        }
        if (line.includes('Conductor ready.')) {
          try {
            const adminWebsocket = await AdminWebsocket.connect({
              url: new URL(`ws://localhost:${adminPort}`),
              wsClientOptions: {
                origin: 'holochain-launcher',
              },
            });
            console.log('Connected to admin websocket.');
            const installedApps = await adminWebsocket.listApps({});
            const appInterfaces = await adminWebsocket.listAppInterfaces();
            console.log('Got appInterfaces: ', appInterfaces);

            const attachAppInterfaceResponse = await adminWebsocket.attachAppInterface({
              allowed_origins: app.isPackaged
                ? 'app://-,webhapp://webhappwindow,holochain-launcher'
                : 'http://localhost:5173,webhapp://webhappwindow,holochain-launcher',
            });
            console.log('Attached app interface port: ', attachAppInterfaceResponse);
            const appPort = attachAppInterfaceResponse.port;

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
          } catch (error) {
            handleError(error);
          }
        }
      });
    });
  }

  /**
   * Installs a webhapp from bytes and stores all relevant data and metadata on disk.
   * If an icon is provided, this icon will be stored alongside with the UI assets.
   * If no icon is passed but an icon.png file is present in the UI assets,
   * this icon gets stored instead.
   *
   * @param happAndUiBytes
   * @param appId
   * @param distributionInfo
   * @param networkSeed
   * @param membrane_proofs
   * @param icon
   */
  async installWebHappFromBytes({
    happAndUiBytes,
    appId,
    distributionInfo,
    networkSeed,
    membrane_proofs,
    icon,
    agentPubKey,
  }: {
    happAndUiBytes: HappAndUiBytes;
    appId: string;
    distributionInfo: DistributionInfoV1;
    networkSeed?: string;
    membrane_proofs?: { [key: string]: MembraneProof };
    icon?: Uint8Array;
    agentPubKey?: AgentPubKeyB64;
  }) {
    if (!happAndUiBytes.uiBytes) throw new Error('UI bytes undefined.');

    const happSha256 = this.storeHapp(happAndUiBytes.happBytes);
    const uiZipSha256 = this.storeUiIfNecessary(happAndUiBytes.uiBytes, icon);

    await this.installWebhappFromHashes({
      agentPubKey,
      happSha256,
      uiZipSha256,
      appId,
      distributionInfo,
      networkSeed,
      membrane_proofs,
    });
  }

  async installHeadlessHappFromBytes({
    happBytes,
    appId,
    distributionInfo,
    networkSeed,
    membrane_proofs,
    agentPubKey,
  }: {
    happBytes: Array<number>;
    appId: string;
    distributionInfo: DistributionInfoV1;
    networkSeed?: string;
    membrane_proofs?: { [key: string]: MembraneProof };
    agentPubKey?: AgentPubKeyB64;
  }) {
    // write [sha256].happ to happs directory
    const happHasher = crypto.createHash('sha256');
    const happSha256 = happHasher.update(Buffer.from(happBytes)).digest('hex');
    const happFilePath = path.join(this.fs.happsDir(this.holochainDataRoot), `${happSha256}.happ`);
    writeFile(happFilePath, Buffer.from(happBytes));

    let pubKey: AgentPubKey;

    if (agentPubKey) {
      pubKey = decodeHashFromBase64(agentPubKey);
    } else {
      pubKey = await this.adminWebsocket.generateAgentPubKey();
    }

    const appInfo = await this.installApp({
      agent_key: pubKey,
      installed_app_id: appId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      membrane_proofs: membrane_proofs ? membrane_proofs : (null as any),
      path: happFilePath,
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
        distributionInfo,
      },
    };

    if (!fs.existsSync(this.fs.appMetadataDir(appId, this.holochainDataRoot))) {
      fs.mkdirSync(this.fs.appMetadataDir(appId, this.holochainDataRoot), { recursive: true });
    }

    this.integrityChecker.storeToSignedJSON(
      path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
      metaData,
    );

    // Enabling is expected to fail for apps with deferred memproof
    try {
      await this.adminWebsocket.enableApp({ installed_app_id: appId });
    } catch (e) {
      // do nothing
    }

    console.log('Installed app.');
    const installedApps = await this.adminWebsocket.listApps({});
    // console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
    this.launcherEmitter.emit(APP_INSTALLED, {
      version: this.version,
      holochainDataRoot: this.holochainDataRoot,
      data: appInfo,
    });
    this.launcherEmitter.emit(REFETCH_DATA_IN_ALL_WINDOWS, `install-${appId}`);
  }

  async installWebhappFromHashes({
    happSha256,
    uiZipSha256,
    appId,
    distributionInfo,
    networkSeed,
    membrane_proofs,
    agentPubKey,
  }: {
    happSha256: string;
    uiZipSha256: string;
    appId: string;
    distributionInfo: DistributionInfoV1;
    networkSeed?: string;
    membrane_proofs?: { [key: string]: MembraneProof };
    agentPubKey?: AgentPubKeyB64;
  }): Promise<void> {
    if (!this.isUiAvailable(uiZipSha256)) {
      throw new Error('UI not found for this hash. UI needs to be stored from bytes first.');
    }
    if (!this.isHappAvailableAndValid(happSha256)) {
      throw new Error(
        'happ file not found for this hash or its sha256 is invalid. happ file needs to be stored from bytes first.',
      );
    }

    let pubKey: AgentPubKey;
    if (agentPubKey) {
      pubKey = decodeHashFromBase64(agentPubKey);
    } else {
      pubKey = await this.adminWebsocket.generateAgentPubKey();
    }

    const installedAppsPriorToInstallation = await this.adminWebsocket.listApps({});
    const duplicateAppId = installedAppsPriorToInstallation.find(
      (app) => app.installed_app_id === appId,
    );

    if (duplicateAppId) throw new Error(APP_ALREADY_INSTALLED_ERROR);

    const appInfo = await this.installApp({
      agent_key: pubKey,
      installed_app_id: appId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      membrane_proofs: membrane_proofs ? membrane_proofs : (null as any),
      path: this.happFilePath(happSha256),
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
        distributionInfo,
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

    // Enabling is expected to fail for apps with deferred memproof
    try {
      await this.adminWebsocket.enableApp({ installed_app_id: appId });
    } catch (e) {
      // do nothing
    }

    const installedApps = await this.adminWebsocket.listApps({});
    // console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
    this.launcherEmitter.emit(APP_INSTALLED, {
      version: this.version,
      holochainDataRoot: this.holochainDataRoot,
      data: appInfo,
    });
    this.launcherEmitter.emit(REFETCH_DATA_IN_ALL_WINDOWS, `install-${appId}`);
  }

  async installApp(payload: InstallAppRequest): Promise<AppInfo> {
    const installedApps = await this.adminWebsocket.listApps({});
    const duplicatePubkey = installedApps.find(
      (appInfo) =>
        encodeHashToBase64(appInfo.agent_pub_key) === encodeHashToBase64(payload.agent_key),
    );
    if (duplicatePubkey) throw new Error(DUPLICATE_PUBKEY_ERROR_MESSAGE);

    const duplicateAppId = installedApps.find(
      (app) => app.installed_app_id === payload.installed_app_id,
    );

    if (duplicateAppId) throw new Error('An app with the same name is already installed.');

    try {
      const appInfo = await this.adminWebsocket.installApp(payload);
      return appInfo;
    } catch (e) {
      if (!duplicateAppId) {
        // DANGER It's crucial that the app is only uninstalled again in case the error is not that another app
        // of the same InstalledAppId is already installed
        // If this fails, e.g. due to a timeout, the app may actually still be installed in the conductor
        // and should get removed again to ensure that there is no app installed without associated meta-data
        try {
          await this.adminWebsocket.uninstallApp({ installed_app_id: payload.installed_app_id! });
          this.launcherEmitter.emit(
            LAUNCHER_ERROR,
            `Uninstalled app after failed installation. Installation error: ${e}`,
          );
        } catch (err) {
          this.launcherEmitter.emit(
            LAUNCHER_ERROR,
            `Failed to uninstall app after failed installation: ${err}`,
          );
          console.warn('Failed to uninstall app after failed installation: ', err);
        }
      }
      throw e;
    }
  }

  async updateUiFromHash(
    uiZipSha256: string,
    appId: string,
    appVersionActionHash?: ActionHashB64,
  ): Promise<void> {
    if (!this.isUiAvailable(uiZipSha256)) {
      throw new Error('UI not found for this hash. UI needs to be stored from bytes first.');
    }

    if (!fs.existsSync(this.fs.appMetadataDir(appId, this.holochainDataRoot))) {
      fs.mkdirSync(this.fs.appMetadataDir(appId, this.holochainDataRoot), { recursive: true });
    }

    const metadata: AppMetadata<AppMetadataV1> = this.integrityChecker.readSignedJSON(
      path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
    );

    if (metadata.data.type !== 'webhapp') throw new Error('Headless apps cannot update a UI.');

    switch (metadata.data.distributionInfo.type) {
      case 'default-app':
      case 'filesystem':
        if (appVersionActionHash)
          throw Error(
            'Passing an appVersionActionHash is only allowed for apps initially installed from appstore.',
          );
        // back up previous metadata to allow undoing updates
        this.integrityChecker.storeToSignedJSON(
          path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json.previous'),
          metadata,
        );

        metadata.data.ui = {
          location: {
            type: 'filesystem',
            sha256: uiZipSha256,
          },
        };

        this.integrityChecker.storeToSignedJSON(
          path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
          metadata,
        );
        break;
      case 'appstore':
        if (!appVersionActionHash)
          throw new Error(
            'When updating the UI of an app installed via appstore, the appVersionActionHash field is required.',
          );
        // back up previous metadata to allow undoing updates
        this.integrityChecker.storeToSignedJSON(
          path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json.previous'),
          metadata,
        );

        metadata.data.ui = {
          location: {
            type: 'filesystem',
            sha256: uiZipSha256,
          },
        };

        metadata.data.distributionInfo.appVersionActionHash = appVersionActionHash;

        this.integrityChecker.storeToSignedJSON(
          path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
          metadata,
        );
        break;
      default:
        throw new Error('Invalid existing distribution info type.');
    }
    this.launcherEmitter.emit(REFETCH_DATA_IN_ALL_WINDOWS, `update-${appId}`);
  }

  /**
   * Stores happ bytes to a [sha256].happ file in the happs directory
   * @param happBytes
   * @returns
   */
  storeHapp(happBytes: Array<number>): string {
    const happHasher = crypto.createHash('sha256');
    const happSha256 = happHasher.update(Buffer.from(happBytes)).digest('hex');
    const happFilePath = this.happFilePath(happSha256);
    writeFile(happFilePath, Buffer.from(happBytes));
    return happSha256;
  }

  private createUiDirectory(uiDir: string, uiBytes: Array<number>): void {
    fs.mkdirSync(uiDir, { recursive: true });

    const hashes: Record<string, string> = {};
    const zip = new AdmZip(Buffer.from(uiBytes));
    zip.getEntries().forEach((entry) => {
      const hash = crypto.createHash('sha256').update(entry.getData()).digest('hex');
      const relativeFilePath = platform.isWindows
        ? entry.entryName.replaceAll('/', '\\')
        : entry.entryName;
      hashes[relativeFilePath] = hash;
    });

    this.integrityChecker.storeToSignedJSON(path.join(uiDir, 'hashes.json'), hashes);
    zip.extractAllTo(path.join(uiDir, 'assets'));
  }
  private handleIconStorage(uiDir: string, icon?: Uint8Array): void {
    const storeIcon = (iconBytes: Uint8Array) => {
      const iconPath = path.join(uiDir, 'icon.png');
      fs.writeFileSync(iconPath, iconBytes);
    };

    if (icon) {
      storeIcon(icon);
      return;
    }

    const maybeIconPngPath = path.join(uiDir, 'assets', 'icon.png');
    if (!fs.existsSync(maybeIconPngPath)) return;

    const iconBytes = fs.readFileSync(maybeIconPngPath);
    if (iconBytes.byteLength > 1100000) {
      this.launcherEmitter.emit(
        'launcher-error',
        `icon.png of the passed UI is too big and won't be stored. Icons need to be 1024x1024 pixel.`,
      );
      console.warn("Icon is too large and won't be stored.");
      return;
    }

    storeIcon(iconBytes);
  }

  /**
   * Extracts and stores ui.zip bytes to a directory named after the sha256 hash of the bytes
   * if that directory does not already exist.
   * If an icon is provided, it is stored alongside the UI assets.
   * If no icon is provided but an icon.png file is present in the UI assets,
   * that icon is stored instead.
   *
   * @param uiBytes - The bytes of the UI zip file.
   * @param icon - Optional icon to be stored with the UI assets.
   * @returns The sha256 hash of the UI zip bytes.
   */
  storeUiIfNecessary(uiBytes: Array<number>, icon?: Uint8Array): string {
    if (icon && !(icon instanceof Uint8Array)) throw new Error('Icon must be of type Uint8Array.');

    // compute UI hash
    const uiZipHasher = crypto.createHash('sha256');
    const uiZipSha256 = uiZipHasher.update(Buffer.from(uiBytes)).digest('hex');

    const uiDir = path.join(this.fs.uisDir(this.holochainDataRoot), uiZipSha256);
    const assetsPath = path.join(uiDir, 'assets');

    // here we assume that if the uiDir exists, the hashes.json exists as well.
    if (!fs.existsSync(assetsPath)) {
      this.createUiDirectory(uiDir, uiBytes);
    }

    this.handleIconStorage(uiDir, icon);

    return uiZipSha256;
  }

  happFilePath(happSha256: string): string {
    return path.join(this.fs.happsDir(this.holochainDataRoot), `${happSha256}.happ`);
  }

  async uninstallApp(appId: string) {
    await this.adminWebsocket.uninstallApp({ installed_app_id: appId });
    fs.rmSync(this.fs.appMetadataDir(appId, this.holochainDataRoot), { recursive: true });
    // Delete persisted session data
    const partition = happSessionName(this.holochainDataRoot.name, appId);
    const ses = session.fromPartition(partition);
    await ses.clearStorageData();

    console.log('Uninstalled app.');
    const installedApps = await this.adminWebsocket.listApps({});
    console.log('Installed apps: ', installedApps);
    this.installedApps = installedApps;
    this.launcherEmitter.emit(REFETCH_DATA_IN_ALL_WINDOWS, `uninstall-${appId}`);
    // TODO Potentially remove .happ file and ui directory in case it is not used by any
    // other app instance anymore. This would mean however that happ and UI would need
    // to be fetched over the network again if the same happ and UI shall be installed
    // at a later time
  }

  async enableApp(appId: string) {
    await this.adminWebsocket.enableApp({ installed_app_id: appId });
    const installedApps = await this.adminWebsocket.listApps({});
    this.installedApps = installedApps;
    this.launcherEmitter.emit(REFETCH_DATA_IN_ALL_WINDOWS, `enableApp-${appId}`);
  }

  async disableApp(appId: string) {
    await this.adminWebsocket.disableApp({ installed_app_id: appId });
    const installedApps = await this.adminWebsocket.listApps({});
    this.installedApps = installedApps;
    this.launcherEmitter.emit(REFETCH_DATA_IN_ALL_WINDOWS, `disableApp-${appId}`);
  }

  /**
   * Checks whether a UI with this hash is already stored on disk. If yes, it does not need
   * to be fetched from devhub
   *
   * @param sha256Ui sha256 hash of the zipped UI assets
   */
  isUiAvailable(uiZipSha256: string): boolean {
    const uiDir = path.join(this.fs.uisDir(this.holochainDataRoot), uiZipSha256);
    // here we assume that if the uiDir exists, the hashes.json exists as well.
    return fs.existsSync(path.join(uiDir, 'assets'));
  }

  /**
   * Checks whether a .happ file with this hash is already stored on disk. If yes, it does not
   * need to be fetched from devhub
   *
   * @param happSha256 sha256 of the .happ file
   */
  isHappAvailableAndValid(happSha256: string): boolean {
    const happFilePath = this.happFilePath(happSha256);
    if (!fs.existsSync(happFilePath)) {
      return false;
    }
    const happBytes = fs.readFileSync(happFilePath);
    const happHasher = crypto.createHash('sha256');
    const happSha256Actual = happHasher.update(Buffer.from(happBytes)).digest('hex');
    if (happSha256Actual !== happSha256) {
      this.launcherEmitter.emit(
        'launcher-error',
        `Found corrupted .happ file on disk. Expected sha256: ${happSha256}. Actual sha256: ${happSha256Actual}. The corrupted file will likely get overwritten with a valid one.`,
      );
      console.warn(
        `Found corrupted .happ file on disk. Expected sha256: ${happSha256}. Actual sha256: ${happSha256Actual}`,
      );
      return false;
    }
    return true;
  }

  appIcon(appId: string): Uint8Array | undefined {
    const metadata: AppMetadata<AppMetadataV1> = this.integrityChecker.readSignedJSON(
      path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
    );

    if (
      metadata.data.type !== 'webhapp' ||
      !metadata.data.ui ||
      metadata.data.ui.location.type !== 'filesystem'
    ) {
      return undefined;
    }

    const iconPath = path.join(
      this.fs.uisDir(this.holochainDataRoot),
      metadata.data.ui.location.sha256,
      'icon.png',
    );

    return fs.existsSync(iconPath) ? fs.readFileSync(iconPath) : undefined;
  }

  appDistributionInfo(appId: string): DistributionInfoV1 {
    const metadata: AppMetadata<AppMetadataV1> = this.integrityChecker.readSignedJSON(
      path.join(this.fs.appMetadataDir(appId, this.holochainDataRoot), 'info.json'),
    );
    return metadata.data.distributionInfo;
  }

  async getAppToken(appId: InstalledAppId): Promise<AppAuthenticationToken> {
    const appTokens = this.appTokens;
    const token = appTokens[appId];
    if (token) return token;
    const response = await this.adminWebsocket.issueAppAuthenticationToken({
      installed_app_id: appId,
      single_use: false,
      expiry_seconds: 99999999,
    });
    appTokens[appId] = response.token;
    this.appTokens = appTokens;
    return response.token;
  }
}

function writeFile(filePath: string, contents: string | NodeJS.ArrayBufferView): void {
  const dirname = path.dirname(filePath);
  fs.mkdirSync(dirname, { recursive: true });
  fs.writeFileSync(filePath, contents);
}
