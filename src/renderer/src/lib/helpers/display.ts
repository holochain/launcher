import { decodeHashFromBase64, encodeHashToBase64 } from '@holochain/client';
import type { ModalSettings, ModalStore } from '@skeletonlabs/skeleton';

import type { AppWithIcon, Modals } from '$types';
import { All, type AppstoreFilterLists, HolochainFoundationList } from '$types/happs';

export const showModalError = ({
	modalStore,
	errorTitle,
	errorMessage,
	response
}: {
	modalStore: ModalStore;
	errorTitle: string;
	errorMessage: string;
	response?: (r: unknown) => void;
}) => {
	const modal: ModalSettings = {
		type: 'alert',
		title: errorTitle,
		body: errorMessage,
		response: response
	};
	modalStore.trigger(modal);
};

export const createModalParams = (
	component: Modals,
	response?: (r: unknown) => void,
	body?: string,
): ModalSettings => ({
	type: 'component' as const,
	component,
	body,
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

export const filterOutDenylisted = (
	apps: AppWithIcon[],
	allowlist: AppstoreFilterLists | undefined
) => {
	const denylist = allowlist?.denylist;
	if (!denylist) return apps;

	return apps.filter((app) => !denylist.includes(encodeHashToBase64(app.id)));
};

export const filterAppsBySearchAndAllowlist = (
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
