export const INITIALIZE_LAIR_KEYSTORE_ERROR = 'initializeLairKeystoreError';
export const LAUNCH_LAIR_KEYSTORE_ERROR = 'launchLairKeystoreError';
export const FAILED_TO_CREATE_SYMLINKED_LAIR_DIRECTORY_ERROR =
  'failedToCreateSymlinkedLairDirectoryError';
export const WRONG_PASSWORD = 'wrongPassword';
export const WRONG_INSTALLED_APP_STRUCTURE = 'wrongInstalledAppStructure';
export const CHECK_INITIALIZED_KEYSTORE_ERROR = 'checkInitializedKeystoreError';
export const NO_RUNNING_HOLOCHAIN_MANAGER_ERROR = 'noRunningHolochainManagerError';
export const FILE_UNDEFINED_ERROR = 'fileUndefinedError';

export type ErrorWithMessage = {
  message: string;
};
