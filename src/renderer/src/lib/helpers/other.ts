import { encodeHashToBase64 } from '@holochain/client';

import { createAppStoreClient, createDevHubClient } from '$services';
import {
	type CellId,
	CellInfoSchema,
	type ExtendedAppInfo,
	ExtendedAppInfoSchema
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

export const initializeAppPortSubscription = (appPort: {
	subscribe: (
		callback: (arg: { isSuccess: boolean; data: number | undefined }) => Promise<void>
	) => () => void;
}) => {
	const unsubscribe = appPort.subscribe(async ({ isSuccess, data }) => {
		if (isSuccess && data) {
			await createAppStoreClient(data);
			await createDevHubClient(data);
			unsubscribe();
		}
	});
};
