<script lang="ts">
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { MODAL_INSTALL_KANDO } from '$const';
	import { createModalParams } from '$helpers';
	import { i18n, trpc } from '$services';
	import { navigationStore } from '$stores';

	import { APPS_VIEW } from '../../../../../../types';

	const client = trpc();

	const modalStore = getModalStore();

	const installedApps = client.getInstalledApps.createQuery();

	const modal = createModalParams(MODAL_INSTALL_KANDO);
</script>

<div class="card flex items-center p-4 dark:variant-soft-warning">
	<Avatar initials={'kn'} rounded="rounded-2xl" background="dark:bg-app-gradient" />

	<div class="ml-4 mr-2 flex-1">
		<h3 class="h3">{$i18n.t('kando')}</h3>
		<p class="line-clamp-2 text-xs leading-[0.8rem] opacity-60">
			Holochain hApp for collaborative KanBan boards. Real-time collaboration delivered by syn
		</p>
	</div>
	<div class="flex flex-col items-center">
		{#if $installedApps.isSuccess && $installedApps.data.length > 0}
			<Button
				props={{
					onClick: () => navigationStore.set(APPS_VIEW),
					class: 'btn-app-store variant-ringed-warning mb-2'
				}}>{$i18n.t('launch')}</Button
			>
		{/if}
		<Button
			props={{
				onClick: () => modalStore.trigger(modal),
				class: 'btn-app-store variant-filled'
			}}>{$i18n.t('install')}</Button
		>
	</div>
</div>
