import { SETTINGS_SCREEN } from '$shared/const';

export const MODAL_INSTALL_FROM_FILE = 'modalInstallFromFile';
export const MODAL_INSTALL_KANDO = 'modalInstallKando';
export const MODAL_ADD_NEW_HAPP_VERSION = 'modalAddNewHappVersion';
export const MODAL_DEVHUB_INSTALLATION_CONFIRMATION = 'modalDevHubInstallationConfirmation';

export const SELECTED_ICON_STYLE = 'fill-light-primary dark:fill-white';

export const DEV_PAGE = `${SETTINGS_SCREEN}/dev`;
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
