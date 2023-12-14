import { App } from 'electron';
import fs from 'fs';
import path from 'path';

export type Profile = string;

class LauncherFileSystem {
  public appDataDir: string;
  public appConfigDir: string;
  public appLogsDir: string;

  constructor(appDataDir: string, appConfigDir: string, appLogsDir: string) {
    this.appDataDir = appDataDir;
    this.appConfigDir = appConfigDir;
    this.appLogsDir = appLogsDir;
  }

  static connect(app: App, profile?: Profile) {
    profile = profile ? profile : 'default';

    const defaultLogsPath = app.getPath('logs');
    console.log('defaultLogsPath: ', defaultLogsPath);
    // app.setPath('logs', path.join(defaultLogsPath, profile));
    const defaultUserDataPath = app.getPath('userData');
    console.log('defaultUserDataPath: ', defaultUserDataPath);
    // check whether userData path has already been modified, otherwise, set paths to point
    // to the profile-specific paths
    if (!defaultUserDataPath.endsWith(profile)) {
      app.setPath('logs', path.join(defaultUserDataPath, profile, 'logs'));
      app.setAppLogsPath(path.join(defaultUserDataPath, profile, 'logs'));
      app.setPath('userData', path.join(defaultUserDataPath, profile));
      app.setPath('sessionData', path.join(defaultUserDataPath, profile, 'chromium'));
      fs.rmdirSync(defaultLogsPath);
    }

    // app.setPath()
    // app.setAppLogsPath([path])
    // const

    const logsDir = app.getPath('logs');
    const configDir = path.join(app.getPath('userData'), 'config');
    const dataDir = path.join(app.getPath('userData'), 'data');

    console.log('Got logsDir, configDir and dataDir: ', logsDir, configDir, dataDir);

    createDirIfNotExists(logsDir);
    createDirIfNotExists(configDir);
    createDirIfNotExists(dataDir);

    const launcherFileSystem = new LauncherFileSystem(dataDir, configDir, logsDir);

    launcherFileSystem.createInitialDirectoryStructure();
    return launcherFileSystem;
  }

  createInitialDirectoryStructure = () => {
    createDirIfNotExists(this.keystoreDir);
    createDirIfNotExists(path.join(this.appDataDir, 'holochain'));
    createDirIfNotExists(path.join(this.appDataDir, 'uis'));
    createDirIfNotExists(path.join(this.appConfigDir, 'holochain'));
  };

  get keystoreDir() {
    return path.join(this.appDataDir, 'lair');
  }

  get holochainDir() {
    return path.join(this.appDataDir, 'holochain');
  }

  get uisDir() {
    return path.join(this.appDataDir, 'uis');
  }

  get conductorConfigPath() {
    return path.join(this.appConfigDir, 'holochain', 'conductor-config.yaml');
  }

  appUiDir(appId: string) {
    return path.join(this.uisDir, appId);
  }

  keystoreInitialized = () => {
    return fs.existsSync(path.join(this.keystoreDir, 'lair-keystore-config.yaml'));
  };
}

function createDirIfNotExists(path: fs.PathLike) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

export { LauncherFileSystem };
