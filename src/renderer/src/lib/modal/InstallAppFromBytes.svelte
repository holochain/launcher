<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { PRESEARCH_URL_QUERY } from '$const';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW, DISTRIBUTION_TYPE_APPSTORE } from '$shared/const';

	import ModalInstallForm from './ModalInstallForm.svelte';

	const client = trpc();

	const modalStore = getModalStore();

	export let bytes: Uint8Array;
	export let appName: string;
	export let appstoreDnaHash: string;
	export let appEntryActionHash: string;
	export let appVersionActionHash: string;
	export let appVersion: string;

	let formData = {
		appId: '',
		networkSeed: ''
	};

	const installedApps = client.getInstalledApps.createQuery();
	const installWebhappFromBytes = client.installWebhappFromBytes.createMutation();
</script>

<ModalInstallForm
	name={appName}
	bind:formData
	onSubmit={() =>
		$installWebhappFromBytes.mutate(
			{
				bytes: bytes,
				distributionInfo: {
					type: DISTRIBUTION_TYPE_APPSTORE,
					appName,
					appstoreDnaHash,
					appEntryActionHash,
					appVersionActionHash,
					appVersion
				},
				appId: formData.appId,
				networkSeed: formData.networkSeed
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
	isPending={$installWebhappFromBytes.isPending}
/>
