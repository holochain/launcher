import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';
import type { AppToInstall } from '$shared/types';

export const APP_STORE_SHA256 = 'e75e94b26e97e7ae9f8e9ea5d5ae0b532d561b7d12b4469275ea34ee06dcfd9c';
export const DEVHUB_SHA256 = '30faeccb7c0333ffd5a01e3be111dac71773ad344ecb386f2f011bf61e513d96';

export const APP_STORE_INSTALL: AppToInstall = {
  id: APP_STORE_APP_ID,
  sha256: APP_STORE_SHA256,
  name: 'appstore.happ',
  progressUpdate: 'installingAppStore',
};

export const DEVHUB_INSTALL: AppToInstall = {
  id: DEVHUB_APP_ID,
  sha256: DEVHUB_SHA256,
  name: 'devhub.happ',
  progressUpdate: 'installingDevHub',
};

export const DEFAULT_APPS_TO_INSTALL: AppToInstall[] = [APP_STORE_INSTALL];

/**
 * Filesystem related constants
 */
export const KEYSTORE_DIRNAME = 'lair';
export const HOLOCHAIN_DIRNAME = 'holochain';
export const CONFIG_DIRNAME = 'config';
export const CONDUCTOR_ENV_DIRNAME = 'dbs';
export const UIS_DIRNAME = 'uis';
export const HAPPS_DIRNAME = 'happs';
export const APPS_DIRNAME = 'apps';

export const BACKUP_INFO_FILENAME = 'backup.info.json';
export const BACKUP_LOG_FILENAME = 'backups.log';
