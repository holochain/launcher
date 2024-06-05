import { isNonEmptyString, isUint8Array } from '$helpers';
import type { ActionHash, AnyDhtHash, EntryHash } from '@holochain/client';

type BaseAppData = {
	title: string;
	subtitle: string;
	description: string;
	icon: Uint8Array;
};

export type AppWithIcon = BaseAppData & {
	id: ActionHash;
	action: ActionHash;
	apphubHrlTarget: AnyDhtHash;
};

export type AppData = BaseAppData & {
	bytes: Uint8Array;
	version: string;
};

export type PublishNewVersionData = {
	bytes: Uint8Array;
	version: string;
	webappPackageId: ActionHash;
	appEntryId: ActionHash;
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
	action: isUint8Array,
	apphubHrlTarget: isUint8Array,
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
