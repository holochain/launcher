type CommonInputProps = {
	id?: string;
	class?: string;
};

type FileProps = {
	accept: '.webhapp';
};

type TextProps = {
	placeholder: string;
	required?: boolean;
};

export type InputProps =
	| (CommonInputProps & TextProps & { type: 'text' })
	| (CommonInputProps & FileProps & { type: 'file' })
	| (CommonInputProps & TextProps & { type: 'password' });

type CommonButtonProps = {
	onClick?: (event: MouseEvent) => void;
	class?: string;
};

export type ButtonProps =
	| (CommonButtonProps & {
			disabled: boolean;
	  })
	| (CommonButtonProps & {
			type: 'submit';
	  })
	| (CommonButtonProps & {
			type: 'button';
	  })
	| CommonButtonProps;
