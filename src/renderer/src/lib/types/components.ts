type CommonInputProps = {
	id?: string;
	class?: string;
	autofocus?: boolean;
};

type FileProps = {
	accept: '.webhapp';
};

type TextProps = {
	placeholder?: string;
	required?: boolean;
};

export type InputProps =
	| (CommonInputProps & TextProps & { type: 'text' })
	| (CommonInputProps & FileProps & { type: 'file' })
	| (CommonInputProps & TextProps & { type: 'password' });

export type ButtonProps = {
	onClick?: (event: MouseEvent) => void;
	class?: string;
	disabled?: boolean;
	type?: 'submit' | 'button' | 'reset';
};

export const AppStore = 'app-store';
export const AppsView = 'apps-view';

export type AppHeader = typeof AppStore | typeof AppsView;
