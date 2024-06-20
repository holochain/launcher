import { z } from 'zod';

const AppEntryAllowListSchema = z.object({
	actions: z.union([z.array(z.string()), z.literal('all')]),
	appVersions: z.union([z.array(z.string()), z.literal('all')])
});

const AppStoreAllowListSchema = z.record(AppEntryAllowListSchema);

const AppStoreDenyListSchema = z.array(z.string());

export const AppstoreFilterListsSchema = z.object({
	allowlists: z.record(AppStoreAllowListSchema).default({}),
	denylist: AppStoreDenyListSchema.default([])
});

export type AppstoreFilterLists = z.infer<typeof AppstoreFilterListsSchema>;
