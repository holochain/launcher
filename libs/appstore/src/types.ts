import type { ActionHash } from '@holochain/client';

export type UpdateEntityInput<T> = {
  base: ActionHash;
  properties: T;
};
