import { type CellId, CellInfoSchema } from '../../../../types';

export function getCellId(cellInfo: unknown): CellId | undefined {
	console.log('getCellId', cellInfo);
	const parsedCellInfo = CellInfoSchema.safeParse(cellInfo);

	if (!parsedCellInfo.success) {
		console.log(parsedCellInfo.error);
	}

	if (!parsedCellInfo.success || 'stem' in parsedCellInfo.data) {
		return undefined;
	}

	if ('provisioned' in parsedCellInfo.data) {
		return parsedCellInfo.data.provisioned.cell_id;
	}

	return parsedCellInfo.data.cloned.cell_id;
}
