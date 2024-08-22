import type {
	MODAL_ADD_NEW_HAPP_VERSION,
	MODAL_DEVHUB_INSTALLATION_CONFIRMATION,
	MODAL_ENTER_PASSPHRASE,
	MODAL_FACTORY_RESET_CONFIRMATION,
	MODAL_INSTALL_FROM_FILE,
	MODAL_INSTALL_KANDO,
	MODAL_STARTUP_ERROR,
	MODAL_UNINSTALL_APP_CONFIRMATION
} from '$const';

type CommonInputProps = {
	id?: string;
	class?: string;
	autofocus?: boolean;
};

type FileProps = {
	accept: '.webhapp' | 'image/*';
};

type TextProps = {
	placeholder?: string;
	required?: boolean;
	maxlength?: number;
};

export type Modals =
	| typeof MODAL_INSTALL_FROM_FILE
	| typeof MODAL_INSTALL_KANDO
	| typeof MODAL_ADD_NEW_HAPP_VERSION
	| typeof MODAL_FACTORY_RESET_CONFIRMATION
	| typeof MODAL_ENTER_PASSPHRASE
	| typeof MODAL_DEVHUB_INSTALLATION_CONFIRMATION
	| typeof MODAL_UNINSTALL_APP_CONFIRMATION
	| typeof MODAL_STARTUP_ERROR;

export type InputProps =
	| (CommonInputProps & TextProps & { type: 'text' })
	| (CommonInputProps & FileProps & { type: 'file' })
	| (CommonInputProps & TextProps & { type: 'password' });

export type ButtonProps = {
	onClick?: (event: MouseEvent) => void;
	class?: string;
	style?: string;
	disabled?: boolean;
	isLoading?: boolean;
	type?: 'submit' | 'button' | 'reset';
};

export type AppInstallFormData = {
	appId: string;
	networkSeed: string;
	pubKey?: string;
};
