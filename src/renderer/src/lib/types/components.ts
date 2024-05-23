import {
	MODAL_ADD_NEW_HAPP_VERSION,
	MODAL_DEVHUB_INSTALLATION_CONFIRMATION,
	MODAL_INSTALL_FROM_FILE,
	MODAL_INSTALL_KANDO
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
	| typeof MODAL_DEVHUB_INSTALLATION_CONFIRMATION;

export type InputProps =
	| (CommonInputProps & TextProps & { type: 'text' })
	| (CommonInputProps & FileProps & { type: 'file' })
	| (CommonInputProps & TextProps & { type: 'password' });

export type ButtonProps = {
	onClick?: (event: MouseEvent) => void;
	class?: string;
	disabled?: boolean;
	isLoading?: boolean;
	type?: 'submit' | 'button' | 'reset';
};

export type AppInstallFormData = {
	appId: string;
	networkSeed: string;
};
