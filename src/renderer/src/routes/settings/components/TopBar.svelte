<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { IconButton } from '$components';
	import { MODAL_ADD_PUBLISHER } from '$const';
	import { createModalParams } from '$helpers';
	import { Gear, Home, Rocket, Upload } from '$icons';
	import { createAppQueries } from '$queries';
	import { trpc } from '$services';
	import { APP_STORE, APPS_VIEW } from '$shared/types';

	const client = trpc();
	const closeSettings = client.closeSettings.createMutation();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();

	const modalStore = getModalStore();

	const { publishersQuery } = createAppQueries();

	const modal = createModalParams(MODAL_ADD_PUBLISHER);
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<IconButton onClick={() => $closeSettings.mutate(APP_STORE)}><Home /></IconButton>
	<IconButton onClick={() => $closeSettings.mutate(APPS_VIEW)}><Rocket /></IconButton>
	{#if $isDevhubInstalled.data}
		<IconButton
			onClick={() => {
				console.log($publishersQuery.data);
				if ($publishersQuery.isSuccess && $publishersQuery.data.length < 1) {
					modalStore.trigger(modal);
				}
			}}><Upload /></IconButton
		>
	{/if}
	<IconButton buttonClass="ml-auto p-2 bg-black rounded-md"><Gear /></IconButton>
</div>
