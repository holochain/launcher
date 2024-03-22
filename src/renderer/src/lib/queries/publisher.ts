import { createQuery } from '@tanstack/svelte-query';
import { get } from 'svelte/store';

import { getAppStoreClient } from '$services';

export const PUBLISHERS_QUERY_KEY = 'publishers';

export const usePublishers = () => {
	return createQuery({
		queryKey: [PUBLISHERS_QUERY_KEY],
		queryFn: async () => {
			const appStoreClientStore = getAppStoreClient();
			const appStoreClient = get(appStoreClientStore);

			if (appStoreClient) {
				return appStoreClient.appstoreZomeClient.getMyPublishers();
			} else {
				throw new Error('AppStoreClient not initialized');
			}
		}
	});
};
