<script lang="ts">
	import { Avatar, getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { PRESEARCH_URL_QUERY } from '$const';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
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
					toastStore.trigger({
						message: $i18n.t(errorMessage),
						background: 'variant-filled-error'
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
