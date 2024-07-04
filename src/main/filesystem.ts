import { type App, app } from 'electron';
import fs from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';

import type { DistributionInfoV1, HolochainDataRoot } from '$shared/types';

import type { UiHashes } from './holochainManager';
import { type IntegrityChecker } from './integrityChecker';
import { breakingVersion, isWindows, readYamlValue, replaceYamlValue } from './utils';

export type Profile = string;

const KEYSTORE_DIRNAME = 'lair';
const HOLOCHAIN_DIRNAME = 'holochain';
const CONFIG_DIRNAME = 'config';
const CONDUCTOR_ENV_DIRNAME = 'dbs';
const UIS_DIRNAME = 'uis';
const HAPPS_DIRNAME = 'happs';
const APPS_DIRNAME = 'apps';

const BACKUP_INFO_FILENAME = 'backup.info.json';
const BACKUP_LOG_FILENAME = 'backups.log';

/**
 * Version 1 of app metadata structure.
 */
export type AppMetadataV1 = {
  type: 'webhapp' | 'headless';
  happ: {
    sha256: string;
    dnas?: unknown; // sha256 hashes of dnas and zomes
  };
  ui?: {
    location:
      | {
          type: 'filesystem';
          sha256: string; // Also defines the foldername where the unzipped assets are stored
        }
      | {
          type: 'localhost';
          port: number;
        };
  };
  /**
   * Alias for that app in case user wants to change the name of this app displayed after installation
   */
  alias?: string;
  /**
   * Info about where the app has been installed from
   */
  distributionInfo: DistributionInfoV1;
};

export type AppMetadata<T> = {
  /**
   * Version number of the format of the data to be able to update
   * the format without losing backwards compatibility
   */
  formatVersion: number;
  data: T;
};

export type LauncherConfig = {
  backupLocation?: string;
};

type BackupInfo = {
  launcherVersion: string;
  platform: string;
  lastFullBackup: string;
  lastPartialbackup?: string;
};

export class LauncherFileSystem {
  public profileDataDir: string;
  public profileLogsDir: string;
  public profile: string;
  integrityChecker: IntegrityChecker | undefined;

  constructor(profileDataDir: string, profileLogsDir: string, profile: string) {
    this.profileDataDir = profileDataDir;
    this.profileLogsDir = profileLogsDir;
    this.profile = profile;
  }

  static connect(app: App, profile?: Profile) {
    const breakingAppVersion = breakingVersion(app.getVersion());
    profile = profile ? profile : 'default';

    const defaultLogsPath = app.getPath('logs');
    console.log('defaultLogsPath: ', defaultLogsPath);
    // app.setPath('logs', path.join(defaultLogsPath, profile));
    const defaultUserDataPath = app.getPath('userData');
    console.log('defaultUserDataPath: ', defaultUserDataPath);
    // check whether userData path has already been modified, otherwise, set paths to point
    // to the profile-specific paths
    if (!defaultUserDataPath.endsWith(profile)) {
      app.setPath('logs', path.join(defaultUserDataPath, breakingAppVersion, profile, 'logs'));
      app.setAppLogsPath(path.join(defaultUserDataPath, breakingAppVersion, profile, 'logs'));
      app.setPath('userData', path.join(defaultUserDataPath, breakingAppVersion, profile));
      app.setPath(
        'sessionData',
        path.join(defaultUserDataPath, breakingAppVersion, profile, 'chromium'),
      );
      fs.rmdirSync(defaultLogsPath);
    }

    const profileDataDir = app.getPath('userData');
    const profileLogsDir = app.getPath('logs');

    const launcherFileSystem = new LauncherFileSystem(profileDataDir, profileLogsDir, profile);

    launcherFileSystem.createInitialDirectoryStructure();
    return launcherFileSystem;
  }

  createInitialDirectoryStructure = () => {
    createDirIfNotExists(this.keystoreDir);
    createDirIfNotExists(this.holochainDir);
    createDirIfNotExists(this.configDir);
  };

  setIntegrityChecker(integrityChecker: IntegrityChecker) {
    this.integrityChecker = integrityChecker;
  }

  get keystoreDir() {
    return path.join(this.profileDataDir, KEYSTORE_DIRNAME);
  }

  get holochainDir() {
    return path.join(this.profileDataDir, HOLOCHAIN_DIRNAME);
  }

  get configDir() {
    return path.join(this.profileDataDir, CONFIG_DIRNAME);
  }

  holochainPartitionDir(partitionName: string) {
    return path.join(this.holochainDir, partitionName);
  }

  get keystoreConfigPath() {
    return path.join(this.keystoreDir, 'lair-keystore-config.yaml');
  }

  conductorConfigPath(partitionName: string) {
    return path.join(this.holochainDir, partitionName, 'conductor-config.yaml');
  }

  conductorEnvironmentDir(partitionName: string) {
    return path.join(this.holochainDir, partitionName, CONDUCTOR_ENV_DIRNAME);
  }

  get backupFileName() {
    return `launcher-${breakingVersion(app.getVersion())}-backup-${this.profile}`;
  }

  /**
   * This is the directory in which app metadata is stored like the UI associated to the
   * app and the sha256 hash of the .happ file that belongs to it or potentially an alias
   * for the installed_app_id
   *
   * @param holochainDataRoot
   * @returns
   */
  appsDir(holochainDataRoot: HolochainDataRoot) {
    return path.join(this.holochainDataBase(holochainDataRoot), APPS_DIRNAME);
  }

  /**
   * This is the directory in which .happ files are being stored to not have to refetch
   * .happ files over the network if they have already been installed earlier
   *
   * @param holochainDataRoot
   * @returns
   */
  happsDir(holochainDataRoot: HolochainDataRoot) {
    return path.join(this.holochainDataBase(holochainDataRoot), HAPPS_DIRNAME);
  }

  /**
   * This is the directory where UI assets are stored. UI assets are stored
   * in folders named by the sha256 hash of the ui.zip they are originating from
   * which results in deduplication in case multiple apps use the same UI and
   * allows to not have to refetch a UI over the network if the same UI is already
   * used by another app instance.
   * It also opens questions around garbage collection if no app is using a
   * certain UI anymore.
   *
   * @param holochainDataRoot
   * @returns
   */
  uisDir(holochainDataRoot: HolochainDataRoot) {
    return path.join(this.holochainDataBase(holochainDataRoot), UIS_DIRNAME);
  }

  /**
   * Directory where metadata of an app instance is stored. For example which UI
   * it currently uses.
   *
   * @param appId
   * @param holochainDataRoot
   * @returns
   */
  appMetadataDir(appId: string, holochainDataRoot: HolochainDataRoot) {
    return path.join(this.appsDir(holochainDataRoot), appId);
  }

  /**
   * Reads the sha256 hash of the ui zip file to determine the directory
   * where the UI assets for the specified app are stored
   *
   * @param appId
   * @param holochainDataRoot
   * @returns
   */
  appUiDir(appId: string, holochainDataRoot: HolochainDataRoot): string {
    if (!this.integrityChecker) throw new Error('IntegrityCheker not set.');
    const metadataPath = path.join(this.appMetadataDir(appId, holochainDataRoot), 'info.json');
    const appMetaData =
      this.integrityChecker.readSignedJSON<AppMetadata<AppMetadataV1>>(metadataPath);
    if (!appMetaData.data.ui || appMetaData.data.ui.location.type !== 'filesystem')
      throw new Error('App seems to be headless or the metadata file is malformed.');
    const uiSha256 = appMetaData.data.ui.location.sha256;
    return path.join(this.uisDir(holochainDataRoot), uiSha256);
  }

  holochainDataBase(holochainDataRoot: HolochainDataRoot) {
    return holochainDataRoot.type === 'partition'
      ? this.holochainPartitionDir(holochainDataRoot.name)
      : holochainDataRoot.path;
  }

  keystoreInitialized = () => {
    return fs.existsSync(path.join(this.keystoreDir, 'lair-keystore-config.yaml'));
  };

  factoryReset(keepLogs = false) {
    if (keepLogs) throw new Error('Keeping logs across factory reset is currently not supported.');
    fs.rmSync(this.profileDataDir, { recursive: true });
  }

  get launcherConfigPath() {
    return path.join(this.configDir, 'launcher-config.json');
  }

  get launcherConfig(): LauncherConfig | undefined {
    if (fs.existsSync(this.launcherConfigPath)) {
      const configStr = fs.readFileSync(this.launcherConfigPath, 'utf-8');
      return JSON.parse(configStr) as LauncherConfig;
    }
    return undefined;
  }

  /**
   *
   * @param path
   * @returns
   */
  setBackupLocation(path: string) {
    if (!fs.existsSync(path)) {
      throw new Error(
        'The specified path does not exist. The backup location must be set to an existing directory.',
      );
    }
    if (!fs.statSync(path).isDirectory()) {
      throw new Error('The backup location must point to a directory.');
    }
    const launcherConfig = this.launcherConfig;
    if (launcherConfig) {
      launcherConfig.backupLocation = path;
      return launcherConfig;
    } else {
      const launcherConfig = {
        backupLocation: path,
      };
      fs.writeFileSync(this.launcherConfigPath, JSON.stringify(launcherConfig));
      return launcherConfig;
    }
  }

  get backupLocation() {
    const launcherConfig = this.launcherConfig;
    if (launcherConfig) {
      return launcherConfig.backupLocation;
    }
    return undefined;
  }

  /**
   * Backs up all relevant data required for a full recovery of launcher in its current state
   */
  backupFullState() {
    const backupLocation = this.backupLocation;
    if (!backupLocation)
      throw new Error('Failed to backup launcher data. No backup location defined.');
    const backupRoot = path.join(backupLocation);
    const backupLogPath = path.join(backupRoot, BACKUP_LOG_FILENAME);
    const backupInfoPath = path.join(backupRoot, BACKUP_INFO_FILENAME);
    createDirIfNotExists(backupRoot);
    const start = Date.now();
    // 1. back up all lair related data
    // function that starts at the leaves, overwrites directory by directory by copying it over
    try {
      console.log('backing up lair...');
      fs.cpSync(this.keystoreDir, path.join(backupRoot, KEYSTORE_DIRNAME), {
        recursive: true,
        preserveTimestamps: true,
      });
      console.log('lair backed up');
    } catch (e) {
      if (e?.toString().includes('socket file')) {
        // socket file cannot and does not need to be copied -> do nothing
      } else {
        const errLog = `${platformLogString('BACKUP')} ERROR: Failed to copy keystore directory: ${e}`;
        fs.appendFileSync(backupLogPath, errLog);
        throw Error(`Failed to copy keystore directory: ${e}`);
      }
    }

    // TODO check for .happ files and UIs that are not in use and don't copy them over

    // TODO
    try {
      fs.cpSync(this.holochainDir, path.join(backupRoot, HOLOCHAIN_DIRNAME), {
        recursive: true,
        preserveTimestamps: true,
        filter: (src, _dst) => !src.endsWith('wasm-cache'),
      });
    } catch (err) {
      const errLog = `${platformLogString('BACKUP')} ERROR: Failed to copy holochain directory: ${err}`;
      fs.appendFileSync(backupLogPath, errLog);
      throw Error(`Failed to copy holochain directory: ${err}`);
    }

    console.log('Copying took ', Date.now() - start, 'ms');

    const successLog = `${platformLogString('BACKUP')} Full state backup successful.`;
    fs.appendFileSync(backupLogPath, successLog);
    let previousBackupInfo: BackupInfo | undefined;
    if (fs.existsSync(backupInfoPath)) {
      previousBackupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf-8'));
    }
    const backupInfo: BackupInfo = {
      launcherVersion: app.getVersion(),
      platform: process.platform,
      lastFullBackup: new Date().toISOString(),
      lastPartialbackup: previousBackupInfo ? previousBackupInfo.lastPartialbackup : undefined,
    };
    fs.writeFileSync(backupInfoPath, JSON.stringify(backupInfo));

    // Store information about last successful backup, i.e. timestamp
  }

  // async backupAppMetaData(
  //   installedAppId: InstalledAppId,
  //   dataRoot: HolochainDataRoot,
  //   cellIds: CellId[],
  // ) {
  //   // data from external data roots do not get backed up
  //   if (dataRoot.type === 'external') return;

  //   // 1. Get dna hashes of app id to back up all authored dbs

  //   // 2. back up app metadata
  //   // 3. back up happ file and UI folder if necessary
  // }

  /**
   * Restores launcher from a backup folder. Optionally accepts a partition name into which the
   *
   * @param backupRoot
   * @param ignoreMissingLogfile If the log file is missing, take the risk and contiue anyway
   */
  async restoreFromBackup(backupRoot: string, ignoreMissingBackupInfoFile?: boolean) {
    // Check launcher version compatiblity
    let backupInfo: BackupInfo | undefined;
    try {
      backupInfo = JSON.parse(
        fs.readFileSync(path.join(backupRoot, BACKUP_INFO_FILENAME), 'utf-8'),
      );
    } catch (e) {
      if (ignoreMissingBackupInfoFile) {
        console.warn(`WARNING Failed to read ${BACKUP_INFO_FILENAME}: ${e}`);
      } else {
        throw Error(`Failed to read ${BACKUP_INFO_FILENAME}: ${e}`);
      }
    }
    if (backupInfo) {
      if (breakingVersion(backupInfo.launcherVersion) !== breakingVersion(app.getVersion())) {
        throw new Error(
          'The chosen backup has been made with a version of Holochain Launcher which is incompatible with this version of the Holochain Launcher.',
        );
      }
    }

    const backupHolochainDir = path.join(backupRoot, 'holochain');
    const backupLairDir = path.join(backupRoot, 'lair');
    if (!fs.existsSync(backupHolochainDir)) {
      throw new Error('Incomplete backup. Holochain data is missing.');
    }
    if (!fs.existsSync(backupLairDir)) {
      throw new Error('Incomplete backup. Lair data is missing.');
    }
    if (fs.readdirSync(this.holochainDir).length !== 0) {
      throw new Error('Existing holochain directory is not empty');
    }
    if (fs.readdirSync(this.keystoreDir).length !== 0) {
      throw new Error('Existing keystore directory is not empty');
    }

    // fs.cp(backupLairDir, this.keystoreDir, { recursive: true }, (err) => {
    //   if (err) throw Error(`Failed to copy lair backup: ${err.message}`);
    //   console.log('COPIED LAIR FOLDER.');
    // });
    // fs.cp(backupHolochainDir, this.holochainDir, { recursive: true }, (err) => {
    //   if (err) throw Error(`Failed to copy holochain backup: ${err.message}`);
    //   console.log('COPIED HOLOCHAIN FOLDER.');
    // });

    fs.cpSync(backupLairDir, this.keystoreDir, { recursive: true });
    fs.cpSync(backupHolochainDir, this.holochainDir, { recursive: true });

    // Modify lair-keystore-config.yaml and conductor-config.yaml to point to the environment specific file locations
    this.osAdjustConfigFiles();
  }

  /**
   * Overwrites paths in lair-keystore-config.yaml and conductor-config.yaml files to the
   * appropriate paths on the new host OS in case data gets restored on a different
   * OS than the backup has been created.
   * Also adjusts the paths in hashes.json file when switching between unix/windows
   */
  osAdjustConfigFiles() {
    // Adjust lair-keystore-config.yaml file
    let lairConfigString = fs.readFileSync(this.keystoreConfigPath, 'utf-8');

    // read the connectionUrl and check whether it's unix or windows
    const connectionUrl = readYamlValue(lairConfigString, 'connectionUrl');
    if (!connectionUrl) throw Error('Failed to read connectionUrl from lair-keystore-config.yaml');

    let unixToWindows = false;
    let windowsToUnix = false;

    // https://github.com/holochain/lair/blob/6a84ed490fc7074d107e38bbb4a8d707e9b8e066/crates/lair_keystore_api/src/config.rs#L229
    if (connectionUrl.startsWith('unix://')) {
      if (isWindows) {
        unixToWindows = true;
        const id = nanoid(21);
        const id_pk = connectionUrl.split('socket?k=')[1];
        const modifiedUrl = `named-pipe:\\\\.\\pipe\\${id}?k=${id_pk}`;
        lairConfigString = replaceYamlValue(lairConfigString, 'connectionUrl', modifiedUrl);
      }
    } else if (connectionUrl.startsWith('named-pipe:')) {
      if (!isWindows) {
        windowsToUnix = true;
        const id_pk = connectionUrl.split('?k=')[1];
        const modifiedUrl = `unix://${this.keystoreDir}/socket?k=${id_pk}`;
        lairConfigString = replaceYamlValue(lairConfigString, 'connectionUrl', modifiedUrl);
      }
    }

    // Overwrite the pidFile and storeFile values to point to the OS specific paths
    lairConfigString = replaceYamlValue(
      lairConfigString,
      'pidFile',
      path.join(this.keystoreDir, 'pid_file'),
    );

    lairConfigString = replaceYamlValue(
      lairConfigString,
      'storeFile',
      path.join(this.keystoreDir, 'store_file'),
    );

    fs.writeFileSync(this.keystoreConfigPath, lairConfigString);

    // Adjust data_root_path in conductor-config.yaml files of all partitions
    const folders = fs.readdirSync(this.holochainDir, { withFileTypes: true });
    const partitions = folders.filter((dirent) => dirent.isDirectory());
    partitions.forEach((dirent) => {
      // Adjust data_root_path to new environment
      const partitionName = dirent.name;
      const conductorConfigString = fs.readFileSync(
        this.conductorConfigPath(partitionName),
        'utf-8',
      );
      const dataRootPath = readYamlValue(conductorConfigString, 'data_root_path');
      if (!dataRootPath)
        throw Error('Failed to read data_root_path value of conductor-config.yaml');
      const modifiedConductorConfigString = replaceYamlValue(
        conductorConfigString,
        'data_root_path',
        this.conductorEnvironmentDir(partitionName),
      );
      fs.writeFileSync(this.conductorConfigPath(partitionName), modifiedConductorConfigString);

      // Adjust all paths in hashes.json files if necessary
      if (unixToWindows) {
        console.log('Restoring on Windows from a backup made on Unix');
        const uisDirectory = path.join(this.holochainDir, partitionName, UIS_DIRNAME);
        const uiFolders = fs
          .readdirSync(uisDirectory, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory());
        uiFolders.forEach((dirent) => {
          const hashesFilePath = path.join(uisDirectory, dirent.name, 'hashes.json');
          if (!this.integrityChecker) {
            throw new Error(
              'Failed to convert hashes.json files to Windows format when restoring a backup made on Unix: IntegrityChecker undefined.',
            );
          }
          if (fs.existsSync(hashesFilePath)) {
            const uiHashes = this.integrityChecker.readSignedJSON<UiHashes>(hashesFilePath);
            const modifiedUiHashes = {};
            Object.keys(uiHashes).forEach((key) => {
              const newKey = key.replace('/', '\\');
              modifiedUiHashes[newKey] = uiHashes[key];
            });
            this.integrityChecker.storeToSignedJSON<UiHashes>(hashesFilePath, modifiedUiHashes);
          } else {
            console.warn(
              'WARNING: No hashes.json file found at expected location: ',
              hashesFilePath,
            );
          }
        });
      }

      if (windowsToUnix) {
        console.log('Restoring on Unix from a backup made on Windows');
        const uisDirectory = path.join(this.holochainDir, partitionName, UIS_DIRNAME);
        const uiFolders = fs
          .readdirSync(uisDirectory, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory());
        uiFolders.forEach((dirent) => {
          const hashesFilePath = path.join(uisDirectory, dirent.name, 'hashes.json');
          if (!this.integrityChecker) {
            throw new Error(
              'Failed to convert hashes.json files to Unix format when restoring a backup made on Windows: IntegrityChecker undefined.',
            );
          }
          if (fs.existsSync(hashesFilePath)) {
            const uiHashes = this.integrityChecker.readSignedJSON<UiHashes>(hashesFilePath);
            const modifiedUiHashes = {};
            Object.keys(uiHashes).forEach((key) => {
              const newKey = key.replace('\\', '/');
              modifiedUiHashes[newKey] = uiHashes[key];
            });
            this.integrityChecker.storeToSignedJSON<UiHashes>(hashesFilePath, modifiedUiHashes);
          } else {
            console.warn(
              'WARNING: No hashes.json file found at expected location: ',
              hashesFilePath,
            );
          }
        });
      }
    });
  }
}

export function createDirIfNotExists(path: fs.PathLike) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export function platformLogString(name: string) {
  return `\n[${name} @ Holochain Launcher ${app.getVersion()} @ ${process.platform} @ ${new Date().toISOString()}]`;
}
