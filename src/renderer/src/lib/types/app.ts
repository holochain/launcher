import { isNonEmptyString, isUint8Array } from '$helpers';

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
	isUint8Array(data.bytes) &&
	'icon' in data &&
	isUint8Array(data.icon) &&
	'title' in data &&
	isNonEmptyString(data.title) &&
	'subtitle' in data &&
	isNonEmptyString(data.subtitle) &&
	'description' in data &&
	isNonEmptyString(data.description) &&
	'version' in data &&
	isNonEmptyString(data.version);
