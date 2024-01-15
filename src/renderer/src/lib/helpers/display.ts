import type { ModalSettings, ModalStore } from '@skeletonlabs/skeleton';

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
