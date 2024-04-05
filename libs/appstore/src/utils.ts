import type { CellId, CellInfo } from '@holochain/client';

export function getCellId(cellInfo: CellInfo): CellId | undefined {
  if ('provisioned' in cellInfo) {
    return cellInfo.provisioned.cell_id;
  }
  if ('cloned' in cellInfo) {
    return cellInfo.cloned.cell_id;
  }
  return undefined;
}
