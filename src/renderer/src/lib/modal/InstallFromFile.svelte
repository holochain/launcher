<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { PRESEARCH_URL_QUERY } from '$const';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';

	import ModalInstallForm from './ModalInstallForm.svelte';

	const client = trpc();
	const modalStore = getModalStore();

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
					modalStore.close();
					console.error(error);
					showModalError({
						modalStore,
						errorTitle: $i18n.t('appError'),
						errorMessage: $i18n.t(error.message)
					});
				}
			}
		)}
	isPending={$installHappFromPathMutation.isPending}
	acceptFileType
/>
