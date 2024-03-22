<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { IconButton } from '$components';
	import { showModalError } from '$helpers';
	import { Gear, Home, Rocket, Upload } from '$icons';
	import { usePublishers } from '$queries';
	import { i18n, trpc } from '$services';
	import { APP_STORE, APPS_VIEW } from '$shared/types';

	const client = trpc();
	const closeSettings = client.closeSettings.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();

	const modalStore = getModalStore();

	const publishers = usePublishers();
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<IconButton onClick={() => $closeSettings.mutate(APP_STORE)}><Home /></IconButton>
	<IconButton onClick={() => $closeSettings.mutate(APPS_VIEW)}><Rocket /></IconButton>
	{#if $isDevhubInstalled.data}
		<IconButton
			onClick={() => {
				console.log($publishers);
				if ($publishers.isSuccess && $publishers.data.length > 0) {
					showModalError({
						modalStore,
						errorTitle: $i18n.t('appError'),
						errorMessage: $i18n.t('youNeedToSetupAtLeastOnePublisher')
					});
				}
			}}><Upload /></IconButton
		>
	{/if}
	<IconButton buttonClass="ml-auto p-2 bg-black rounded-md"><Gear /></IconButton>
</div>
