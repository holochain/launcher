export const APP_STORE_CLIENT_NOT_INITIALIZED_ERROR = 'appStoreClientNotInitializedError';
export const NO_APP_PORT_ERROR = 'noAppPortError';
export const CHECK_INITIALIZED_KEYSTORE_ERROR = 'checkInitializedKeystoreError';
export const DEV_HUB_CLIENT_NOT_INITIALIZED_ERROR = 'devHubClientNotInitializedError';
export const FAILED_TO_CREATE_SYMLINKED_LAIR_DIRECTORY_ERROR =
  'failedToCreateSymlinkedLairDirectoryError';
export const FILE_UNDEFINED_ERROR = 'fileUndefinedError';
export const INITIALIZE_LAIR_KEYSTORE_ERROR = 'initializeLairKeystoreError';
export const LAUNCH_LAIR_KEYSTORE_ERROR = 'launchLairKeystoreError';
export const MISSING_BINARIES = 'missingBinaries';
export const NO_APPSTORE_AUTHENTICATION_TOKEN_FOUND = 'noAppstoreAuthenticationTokenFound';
export const NO_DEVHUB_AUTHENTICATION_TOKEN_FOUND = 'noDevhubAuthenticationTokenFound';
export const NO_PUBLISHERS_AVAILABLE_ERROR = 'noPublishersAvailableError';
export const NO_RUNNING_HOLOCHAIN_MANAGER_ERROR = 'noRunningHolochainManagerError';
export const WRONG_INSTALLED_APP_STRUCTURE = 'wrongInstalledAppStructure';
export const WRONG_PASSWORD = 'wrongPassword';

export type ErrorWithMessage = {
  message: string;
};
