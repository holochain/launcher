import { z } from 'zod';

export const All = z.literal('all');

const AppEntryAllowListSchema = z.object({
	actions: z.union([z.array(z.string()), All]),
	appVersions: z.union([z.array(z.string()), All])
});

const AppStoreAllowListSchema = z.record(AppEntryAllowListSchema);

const AppStoreDenyListSchema = z.array(z.string());

export const HolochainFoundationList = z.literal('Holochain Foundation');

const ListName = z.string().or(HolochainFoundationList);

export const AppstoreFilterListsSchema = z.object({
	allowlists: z.record(ListName, AppStoreAllowListSchema).default({}),
	denylist: AppStoreDenyListSchema.default([])
});

export type AppstoreFilterLists = z.infer<typeof AppstoreFilterListsSchema>;
