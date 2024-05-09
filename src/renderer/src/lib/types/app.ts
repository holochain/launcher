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
	'version' in data &&
	isNonEmptyString(data.version);

export type PublishNewVersionData = {
	bytes: Uint8Array;
	version: string;
	webappPackageId: Uint8Array;
	appEntryId: Uint8Array;
};

export const isPublishNewVersionDataValid = (data: unknown): data is PublishNewVersionData =>
	typeof data === 'object' &&
	data !== null &&
	'bytes' in data &&
	isUint8Array(data.bytes) &&
	'version' in data &&
	isNonEmptyString(data.version) &&
	'webappPackageId' in data &&
	isUint8Array(data.webappPackageId) &&
	'appEntryId' in data &&
	isUint8Array(data.appEntryId);
