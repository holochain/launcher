<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { MODAL_INSTALL_FROM_FILE, PRESEARCH_URL_QUERY } from '$const';
	import { handleInstallError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
	import { APP_NAME_EXISTS_ERROR } from '$shared/types';

	import ModalInstallForm from './ModalInstallForm.svelte';

	const client = trpc();
	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let files: FileList | null = null;
	let formData = {
		appId: '',
		networkSeed: ''
	};

	const installedApps = client.getInstalledApps.createQuery();
	const installHappFromPathMutation = client.installHappFromPath.createMutation();
</script>

<ModalInstallForm
	bind:formData
	bind:files
	onSubmit={() =>
		$installHappFromPathMutation.mutate(
			{
				appId: formData.appId,
				networkSeed: formData.networkSeed,
				filePath: files ? files[0].path : ''
			},
			{
				onSuccess: () => {
					$installedApps.refetch();
					goto(`${APPS_VIEW}?${PRESEARCH_URL_QUERY}=${formData.appId}`);
					modalStore.close();
				},
				onError: (error) => {
					console.error(error);
					const errorMessage = getErrorMessage(error);
					handleInstallError({
						appNameExistsError: errorMessage === APP_NAME_EXISTS_ERROR,
						title: $i18n.t('appError'),
						message: $i18n.t(errorMessage),
						modalStore,
						toastStore,
						modalComponent: MODAL_INSTALL_FROM_FILE
					});
				}
			}
		)}
	isPending={$installHappFromPathMutation.isPending}
	acceptFileType
/>
