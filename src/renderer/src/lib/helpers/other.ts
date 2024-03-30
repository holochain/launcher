import { createAppStoreClient } from '$services';
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

export const validateApp = (app: unknown): app is ExtendedAppInfo =>
	ExtendedAppInfoSchema.safeParse(app).success;

export const base64ToArrayBuffer = (base64: string) => {
	const binaryString = window.atob(base64);
	return new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
};

export const initializeAppPortSubscription = (appPort: {
	subscribe: (
		callback: (arg: { isSuccess: boolean; data: number | undefined }) => Promise<void>
	) => () => void;
}) => {
	const unsubscribe = appPort.subscribe(async ({ isSuccess, data }) => {
		if (isSuccess && data) {
			await createAppStoreClient(data);
			unsubscribe();
		}
	});
};
