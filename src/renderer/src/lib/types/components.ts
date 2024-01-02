type CommonInputProps = {
	id: string;
};

type FileProps = {
	accept: '.webhapp';
	files?: FileList;
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
};

export type ButtonProps =
	| (CommonButtonProps & {
			disabled: boolean;
	  })
	| (CommonButtonProps & {
			type: 'submit';
	  })
	| CommonButtonProps;
