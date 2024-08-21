import { APP_STORE_APP_ID, DEVHUB_APP_ID } from '$shared/const';
import type { AppToInstall } from '$shared/types';

export const APP_STORE_INSTALL: AppToInstall = {
  id: APP_STORE_APP_ID,
  name: 'appstore.happ',
  progressUpdate: 'installingAppStore',
};

export const DEVHUB_INSTALL: AppToInstall = {
  id: DEVHUB_APP_ID,
  name: 'devhub.happ',
  progressUpdate: 'installingDevHub',
};

export const DEFAULT_APPS_TO_INSTALL: AppToInstall[] = [APP_STORE_INSTALL];

export const APP_ALREADY_INSTALLED_ERROR =
  'An app with the same name is already installed. Please choose a different name.';
export const DUPLICATE_PUBKEY_ERROR_MESSAGE =
  'An app with the same public key is already installed. This is not allowed due to security reasons.';

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
