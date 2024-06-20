import { encodeHashToBase64 } from '@holochain/client';
import type { ModalStore, ToastStore } from '@skeletonlabs/skeleton';
import type { AppstoreAppClient, AppVersionEntry, Entity } from 'appstore-tools';

import { MAX_IMAGE_WIDTH_AND_HEIGHT } from '$const';
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
import type { Modals } from '$types';
import { AppstoreFilterListsSchema } from '$types/happs';

import { createModalParams, showModalError } from './display';

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

export const filterValidateAndSortApps = (searchInput: string, apps: unknown[]) => {
	const filteredAndValidatedApps = apps
		.filter(validateApp)
		.filter((app) =>
			app.appInfo.installed_app_id.toLowerCase().includes(searchInput.toLowerCase())
		);

	return filteredAndValidatedApps.sort((a, b) => {
		const idA = a.appInfo.installed_app_id.toLowerCase();
		const idB = b.appInfo.installed_app_id.toLowerCase();
		const exactMatchA = idA === searchInput.toLowerCase() ? 0 : 1;
		const exactMatchB = idB === searchInput.toLowerCase() ? 0 : 1;
		return exactMatchA - exactMatchB;
	});
};

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

export const getVersionByActionHash = (
	appVersions: Entity<AppVersionEntry>[] | undefined,
	actionHash: string
) => {
	if (!appVersions || !Array.isArray(appVersions) || appVersions.length === 0) {
		return '';
	}

	const version = appVersions.find((version) => encodeHashToBase64(version.id) === actionHash);

	return version?.content.version ?? '';
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

export const fetchFilterLists = async (appstoreClient: AppstoreAppClient, isDev: boolean) => {
	const appInfo = await appstoreClient.client.appInfo();
	const cellInfo = appInfo!.cell_info['appstore'][0];
	const branch = isDev ? 'testing' : 'main';
	const cellId = getCellId(cellInfo);
	if (!cellId) {
		throw new Error('Invalid cell info');
	}
	const dnaHash = cellId[0];
	const dnaHashBase64 = encodeHashToBase64(dnaHash);
	const allowListsUrl = `https://raw.githubusercontent.com/holochain/appstore-lists/${branch}/${dnaHashBase64}/lists.json`;

	try {
		const response = await fetch(allowListsUrl);
		return AppstoreFilterListsSchema.parse(await response.json());
	} catch (error) {
		return AppstoreFilterListsSchema.parse({});
	}
};

export const filterHash = (hash: unknown): hash is string => hash !== undefined;

export const adjustDimensions = (width: number, height: number): [number, number] => {
	if (width > height && width > MAX_IMAGE_WIDTH_AND_HEIGHT) {
		return [MAX_IMAGE_WIDTH_AND_HEIGHT, (height * MAX_IMAGE_WIDTH_AND_HEIGHT) / width];
	} else if (height > MAX_IMAGE_WIDTH_AND_HEIGHT) {
		return [(width * MAX_IMAGE_WIDTH_AND_HEIGHT) / height, MAX_IMAGE_WIDTH_AND_HEIGHT];
	}
	return [width, height];
};

export const resizeImage = async (file: File): Promise<Uint8Array | null> => {
	const img = document.createElement('img');
	img.src = URL.createObjectURL(file);
	await img.decode();

	const [newWidth, newHeight] = adjustDimensions(img.width, img.height);

	const canvas = document.createElement('canvas');
	canvas.width = newWidth;
	canvas.height = newHeight;
	const ctx = canvas.getContext('2d');
	ctx?.drawImage(img, 0, 0, newWidth, newHeight);
	return new Promise<Uint8Array | null>((resolve) => {
		canvas.toBlob((blob) => {
			if (blob) {
				const reader = new FileReader();
				reader.onload = () => {
					const arrayBuffer = reader.result as ArrayBuffer;
					resolve(new Uint8Array(arrayBuffer));
				};
				reader.readAsArrayBuffer(blob);
			} else {
				resolve(null);
			}
		}, 'image/png');
	});
};

export const handleInstallError = ({
	appNameExistsError,
	title,
	message,
	modalStore,
	toastStore,
	modalComponent
}: {
	appNameExistsError: boolean;
	title: string;
	message: string;
	modalStore: ModalStore;
	toastStore: ToastStore;
	modalComponent: Modals;
}) => {
	modalStore.close();
	if (appNameExistsError) {
		toastStore.trigger({
			message: message
		});
		const modal = createModalParams(modalComponent);
		return modalStore.trigger(modal);
	}

	return showModalError({
		modalStore,
		errorTitle: title,
		errorMessage: message
	});
};
