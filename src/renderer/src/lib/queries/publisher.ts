import { createMutation, createQuery, QueryClient } from '@tanstack/svelte-query';
import type { CreatePublisherFrontendInput } from 'appstore-tools';
import { get } from 'svelte/store';

import { getAppStoreClient } from '$services';
import { APP_STORE_CLIENT_NOT_INITIALIZED_ERROR } from '$shared/types';

export const PUBLISHERS_QUERY_KEY = 'publishers';

const getAppStoreClientOrThrow = () => {
	const appStoreClientStore = getAppStoreClient();
	const appStoreClient = get(appStoreClientStore);

	if (!appStoreClient) {
		throw new Error(APP_STORE_CLIENT_NOT_INITIALIZED_ERROR);
	}

	return appStoreClient;
};

export const createPublishersQuery = () => {
	return createQuery({
		queryKey: [PUBLISHERS_QUERY_KEY],
		queryFn: () => getAppStoreClientOrThrow().appstoreZomeClient.getMyPublishers()
	});
};

export const createPublisherMutation = (queryClient: QueryClient) => {
	return createMutation({
		mutationFn: (createPublisherInput: CreatePublisherFrontendInput) =>
			getAppStoreClientOrThrow().createPublisher(createPublisherInput),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [PUBLISHERS_QUERY_KEY] })
	});
};
