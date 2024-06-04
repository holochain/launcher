import { isNonEmptyString, isUint8Array } from '$helpers';

type BaseAppData = {
	title: string;
	subtitle: string;
	description: string;
	icon: Uint8Array;
};

export type AppWithIcon = BaseAppData & {
	id: Uint8Array;
	apphubHrlTarget: Uint8Array;
	apphubHrlHash: Uint8Array;
};

export type AppData = BaseAppData & {
	bytes: Uint8Array;
	version: string;
};

export type PublishNewVersionData = {
	bytes: Uint8Array;
	version: string;
	webappPackageId: Uint8Array;
	appEntryId: Uint8Array;
	/**
	 * Sha256 hash of the happ in previous version(s). Sha256 of happ
	 * should never change across versions
	 */
	previousHappHash: string;
};

const isObjectWithProperties = (
	data: unknown,
	properties: Record<string, (value: unknown) => boolean>
): boolean =>
	typeof data === 'object' &&
	data !== null &&
	Object.entries(properties).every(
		([key, validator]) =>
			key in (data as Record<string, unknown>) && validator((data as Record<string, unknown>)[key])
	);

const baseAppDataProperties = {
	title: isNonEmptyString,
	subtitle: isNonEmptyString,
	description: isNonEmptyString,
	icon: isUint8Array
};

const isAppDataProperties = {
	...baseAppDataProperties,
	bytes: isUint8Array,
	version: isNonEmptyString
};

const isAppWithIconProperties = {
	...baseAppDataProperties,
	id: isUint8Array,
	apphubHrlTarget: isUint8Array,
	apphubHrlHash: isUint8Array
};

const isPublishNewVersionDataProperties = {
	bytes: isUint8Array,
	version: isNonEmptyString,
	webappPackageId: isUint8Array,
	appEntryId: isUint8Array,
	previousHappHash: isNonEmptyString
};

export const isAppDataValid = (data: unknown): data is AppData =>
	isObjectWithProperties(data, isAppDataProperties);

export const isUpdateAppDataValid = (data: unknown): data is AppWithIcon =>
	isObjectWithProperties(data, isAppWithIconProperties);
export const isPublishNewVersionDataValid = (data: unknown): data is PublishNewVersionData =>
	isObjectWithProperties(data, isPublishNewVersionDataProperties);
