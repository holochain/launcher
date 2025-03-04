<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { i18n, trpc } from '$services';
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
	const openApp = client.openApp.createMutation();
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
					const filePath = files ? files[0].path : '';
					$installedApps.refetch().then((apps) => {
						// Only open the app if it's an app with UI
						if (filePath.endsWith('.webhapp')) {
							const newApp = apps.data?.find(
								(extendedAppInfo) => extendedAppInfo.appInfo.installed_app_id === formData.appId
							);
							if (newApp) $openApp.mutate(newApp);
						}
					});
					toastStore.trigger({
						message: $i18n.t('appInstalled'),
						background: 'variant-filled-success'
					});
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
