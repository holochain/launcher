export const INITIALIZE_LAIR_KEYSTORE_ERROR = 'initializeLairKeystoreError';
export const LAUNCH_LAIR_KEYSTORE_ERROR = 'launchLairKeystoreError';
export const FAILED_TO_CREATE_SYMLINKED_LAIR_DIRECTORY_ERROR =
  'failedToCreateSymlinkedLairDirectoryError';
export const WRONG_PASSWORD = 'wrongPassword';
export const WRONG_INSTALLED_APP_STRUCTURE = 'wrongInstalledAppStructure';
export const CHECK_INITIALIZED_KEYSTORE_ERROR = 'checkInitializedKeystoreError';

export type ErrorWithMessage = {
  message: string;
};
