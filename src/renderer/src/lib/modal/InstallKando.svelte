<script lang="ts">
	import { Avatar, getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { MODAL_INSTALL_KANDO, PRESEARCH_URL_QUERY } from '$const';
	import { handleInstallError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
	import { APP_NAME_EXISTS_ERROR } from '$shared/types';
	import type { AppInstallFormData } from '$types';

	import ModalInstallForm from './ModalInstallForm.svelte';

	const client = trpc();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let formData: AppInstallFormData = {
		appId: '',
		networkSeed: ''
	};

	const installedApps = client.getInstalledApps.createQuery();
	const installDefaultAppMutation = client.installDefaultApp.createMutation();
</script>

<ModalInstallForm
	bind:formData
	onSubmit={() =>
		$installDefaultAppMutation.mutate(
			{
				name: 'kando.webhapp',
				appId: formData.appId,
				networkSeed: formData.networkSeed,
				agentPubKey: formData.pubKey
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
						modalComponent: MODAL_INSTALL_KANDO
					});
				}
			}
		)}
	isPending={$installDefaultAppMutation.isPending}
>
	<div slot="avatar">
		<Avatar initials={'kn'} rounded="rounded-2xl" background="dark:bg-app-gradient" width="w-20" />
	</div>
</ModalInstallForm>
