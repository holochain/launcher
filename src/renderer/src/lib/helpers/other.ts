import { encodeHashToBase64 } from '@holochain/client';
import type { AppVersionEntry, Entity } from 'appstore-tools';

import { createAppStoreClient, createDevHubClient } from '$services';
import {
	AppStoreDistributionInfoSchema,
	type CellId,
	CellInfoSchema,
	DistributionInfoV1Schema,
	type ExtendedAppInfo,
	ExtendedAppInfoSchema,
	type InitializeAppPorts
} from '$shared/types';

export const getCellId = (cellInfo: unknown): CellId | undefined => {
	const parsedCellInfo = CellInfoSchema.safeParse(cellInfo);

	if (!parsedCellInfo.success || 'stem' in parsedCellInfo.data) {
		return undefined;
	}

	return 'provisioned' in parsedCellInfo.data
		? parsedCellInfo.data.provisioned.cell_id
		: parsedCellInfo.data.cloned.cell_id;
};

export const isNonEmptyString = (value: unknown): value is string =>
	typeof value === 'string' && value.trim() !== '';

export const isUint8Array = (value: unknown): value is Uint8Array => value instanceof Uint8Array;

export const validateApp = (app: unknown): app is ExtendedAppInfo =>
	ExtendedAppInfoSchema.safeParse(app).success;

export const uint8ArrayToURIComponent = (bytes: Uint8Array) =>
	encodeURIComponent(encodeHashToBase64(bytes));

export const base64ToArrayBuffer = (base64: string) => {
	const binaryString = window.atob(base64);
	return new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
};

export const createImageUrl = (icon?: Uint8Array) =>
	icon ? URL.createObjectURL(new File([icon], 'icon')) : undefined;

export const initializeDefaultAppPorts = async (data: InitializeAppPorts) => {
	const { appPort, appstoreAuthenticationToken, devhubAuthenticationToken } = data;

	await createAppStoreClient(appPort, appstoreAuthenticationToken);
	if (devhubAuthenticationToken) {
		await createDevHubClient(appPort, devhubAuthenticationToken);
	}
};

export const getLatestVersion = (appVersions: Entity<AppVersionEntry>[]) => {
	if (!Array.isArray(appVersions) || appVersions.length === 0) {
		return undefined;
	}

	return appVersions.sort((a, b) => b.content.published_at - a.content.published_at)[0];
};

export const convertFileToUint8Array = async (file: File): Promise<Uint8Array> => {
	const buffer = await file.arrayBuffer();
	return new Uint8Array(buffer);
};

export const getAppStoreDistributionHash = (app: unknown): string | undefined => {
	const parsedApp = DistributionInfoV1Schema.safeParse(app);
	if (!parsedApp.success) {
		return undefined;
	}
	const parsedAppData = AppStoreDistributionInfoSchema.safeParse(parsedApp.data);
	if (!parsedAppData.success) {
		return undefined;
	}

	return parsedAppData.data.appVersionActionHash;
};

export const filterHash = (hash: unknown): hash is string => hash !== undefined;
