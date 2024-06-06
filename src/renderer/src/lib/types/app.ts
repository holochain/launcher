import type { ActionHash, AnyDhtHash } from '@holochain/client';

import { isNonEmptyString, isUint8Array } from '$helpers';

type BaseAppData = {
	title: string;
	subtitle: string;
	description: string;
};

export type AppWithHrlTarget = BaseAppData & {
	id: ActionHash;
	apphubHrlTarget: AnyDhtHash;
	icon?: Uint8Array;
};

export type AppWithAction = BaseAppData & {
	action: ActionHash;
	icon?: Uint8Array;
};

export type AppData = BaseAppData & {
	bytes: Uint8Array;
	version: string;
	icon: Uint8Array;
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
	description: isNonEmptyString
};

const isAppDataProperties = {
	...baseAppDataProperties,
	bytes: isUint8Array,
	version: isNonEmptyString,
	icon: isUint8Array
};

const isAppWithActionProperties = {
	...baseAppDataProperties,
	action: isUint8Array
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

export const isAppWithActionValid = (data: unknown): data is AppWithAction =>
	isObjectWithProperties(data, isAppWithActionProperties);

export const isPublishNewVersionDataValid = (data: unknown): data is PublishNewVersionData =>
	isObjectWithProperties(data, isPublishNewVersionDataProperties);
