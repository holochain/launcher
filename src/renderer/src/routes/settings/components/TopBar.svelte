<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { IconButton } from '$components';
	import { ADD_APP_PAGE, MODAL_ADD_PUBLISHER, SELECTED_ICON_STYLE } from '$const';
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

	$: isAddAppPage = $page.url.pathname.endsWith(ADD_APP_PAGE);
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	<IconButton onClick={() => $closeSettings.mutate(APP_STORE)}><Home /></IconButton>
	<IconButton onClick={() => $closeSettings.mutate(APPS_VIEW)}><Rocket /></IconButton>
	{#if $isDevhubInstalled.data}
		<IconButton
			buttonClass={clsx('p-2', isAddAppPage && 'bg-black rounded-md')}
			onClick={() => {
				if (!$publishersQuery.isSuccess) return;
				console.log($publishersQuery.data);
				if ($publishersQuery.data.length < 1) {
					return modalStore.trigger(modal);
				}
				goto(`/settings/${ADD_APP_PAGE}`);
			}}
		>
			{#if isAddAppPage}
				<Upload fillColor={SELECTED_ICON_STYLE} />
			{:else}
				<Upload />
			{/if}
		</IconButton>
	{/if}
	<IconButton buttonClass={clsx('ml-auto p-2', isAddAppPage ? undefined : 'bg-black rounded-md')}>
		{#if isAddAppPage}
			<Gear />
		{:else}
			<Gear fillColor={SELECTED_ICON_STYLE} />
		{/if}
	</IconButton>
</div>
