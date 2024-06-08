import type { ModalSettings, ModalStore } from '@skeletonlabs/skeleton';

import type { Modals } from '$types';

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
