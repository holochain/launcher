export type AppData = {
	icon: Uint8Array;
	title: string;
	subtitle: string;
	description: string;
	bytes: Uint8Array;
	version: string;
};

export const isAppDataValid = (data: unknown): data is AppData =>
	typeof data === 'object' &&
	data !== null &&
	'bytes' in data &&
	data.bytes instanceof Uint8Array &&
	'icon' in data &&
	data.icon instanceof Uint8Array;
