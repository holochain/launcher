import { decodeHashFromBase64 } from '@holochain/client';
import type { ModalSettings, ModalStore } from '@skeletonlabs/skeleton';

import type { AppWithIcon, Modals } from '$types';
import { All, type AppstoreFilterLists, HolochainFoundationList } from '$types/happs';

export const showModalError = ({
	modalStore,
	errorTitle,
	errorMessage
}: {
	modalStore: ModalStore;
	errorTitle: string;
	errorMessage: string;
}) => {
	const modal: ModalSettings = {
		type: 'alert',
		title: errorTitle,
		body: errorMessage
	};
	modalStore.trigger(modal);
};

export const createModalParams = (
	component: Modals,
	response?: (r: unknown) => void
): ModalSettings => ({
	type: 'component' as const,
	component,
	response
});

export const startViewTransition = (navigation: { complete: Promise<void> }): Promise<void> => {
	if (!document.startViewTransition) return Promise.resolve();

	return new Promise((resolve) => {
		document.startViewTransition(async () => {
			resolve();
			await navigation.complete;
		});
	});
};

export const capitalizeFirstLetter = (str: string): string =>
	str.charAt(0).toUpperCase() + str.slice(1);

export const getAllowlistKeys = (allowlist: AppstoreFilterLists | undefined) => {
	const allowlistEntries = allowlist?.allowlists[HolochainFoundationList.value];
	if (!allowlistEntries) return [];

	return Object.entries(allowlistEntries)
		.filter(([, { actions, appVersions }]) => actions === All.value && appVersions === All.value)
		.map(([key]) => decodeHashFromBase64(key));
};

export const filterApps = (
	apps: AppWithIcon[],
	searchInput: string,
	allowlistKeys: Uint8Array[]
) => {
	const lowerCaseSearchInput = searchInput.toLowerCase();
	return apps.filter(
		({ title, id }) =>
			title.toLowerCase().includes(lowerCaseSearchInput) &&
			allowlistKeys.some((key) => key.toString() === id.toString())
	);
};
