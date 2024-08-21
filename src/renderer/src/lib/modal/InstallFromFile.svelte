<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

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

	let files: FileList | null = null;
	let formData: AppInstallFormData = {
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
				agentPubKey: formData.pubKey,
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
					toastStore.trigger({
						message: $i18n.t(errorMessage),
						background: 'variant-filled-error'
					});
				}
			}
		)}
	isPending={$installHappFromPathMutation.isPending}
	acceptFileType
/>
