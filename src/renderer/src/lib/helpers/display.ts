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

export const createModalParams = (component: Modals): ModalSettings => ({
	type: 'component' as const,
	component
});
