import { SETTINGS_WINDOW } from '$shared/const';

export const MAX_IMAGE_WIDTH_AND_HEIGHT = 300;

export const MODAL_INSTALL_FROM_FILE = 'modalInstallFromFile';
export const MODAL_INSTALL_KANDO = 'modalInstallKando';
export const MODAL_ADD_NEW_HAPP_VERSION = 'modalAddNewHappVersion';
export const MODAL_DEVHUB_INSTALLATION_CONFIRMATION = 'modalDevHubInstallationConfirmation';
export const MODAL_ENTER_PASSPHRASE = 'modalEnterPassphrase';
export const MODAL_FACTORY_RESET_CONFIRMATION = 'modalFactoryResetConfirmation';
export const MODAL_UNINSTALL_APP_CONFIRMATION = 'modalUninstallAppConfirmation';
export const MODAL_STARTUP_ERROR = 'modalStartupError';

export const SELECTED_ICON_STYLE = 'fill-light-primary dark:fill-white';
export const NOT_SELECTED_ICON_STYLE =
	'fill-black dark:fill-tertiary-400 dark:group-hover:fill-tertiary-100';

export const DEV_PAGE = `${SETTINGS_WINDOW}/dev`;
export const DEV_APP_PAGE = `${DEV_PAGE}/app`;
export const PUBLISHER_SCREEN = `${DEV_PAGE}/publisher`;

export const SEARCH_URL_QUERY = 'search';
export const PRESEARCH_URL_QUERY = 'presearch';

export const EMPTY_APP_DATA = {
	title: '',
	subtitle: '',
	description: '',
	version: '',
	icon: undefined as Uint8Array | undefined,
	bytes: undefined as Uint8Array | undefined
};
