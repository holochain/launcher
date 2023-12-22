type CommonProps = {
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
	| (CommonProps & TextProps & { type: 'text' })
	| (CommonProps & FileProps & { type: 'file' })
	| (CommonProps & TextProps & { type: 'password' });
