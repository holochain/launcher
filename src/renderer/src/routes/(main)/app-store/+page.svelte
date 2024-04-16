<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { MODAL_INSTALL_KANDO } from '$const';
	import { createModalParams } from '$helpers';
	import { createAppQueries } from '$queries';
	import { APP_STORE } from '$shared/const';

	import MainHeader from '../components/MainHeader.svelte';
	import { AppCard, InstallFromDeviceCard } from './components';

	let searchInput = '';

	$: isKandoInSearch = 'kando'.includes(searchInput.toLowerCase());

	const { appStoreHappsQuery } = createAppQueries();

	function handlePress(event: CustomEvent) {
		if (!(event.detail instanceof KeyboardEvent)) return;

		const { key } = event.detail;

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			searchInput = '';
		}
	}

	const modalStore = getModalStore();

	const modal = createModalParams(MODAL_INSTALL_KANDO);

	const commonButtonClasses = 'card flex cursor-pointer items-center p-4 dark:variant-soft-warning';
</script>

<MainHeader {handlePress} bind:searchInput type={APP_STORE} />

<div class="grow bg-light-background p-4 dark:bg-apps-list-dark-gradient">
	<div class="text-token grid w-full gap-4 md:grid-cols-2">
		{#each $appStoreHappsQuery.isSuccess ? $appStoreHappsQuery.data : [] as app}
			<a class={commonButtonClasses} href={`/${APP_STORE}/${app.id}`}>
				<AppCard icon={app.icon} title={app.title} subtitle={app.subtitle} />
			</a>
		{/each}
		{#if isKandoInSearch}
			<button on:click={() => modalStore.trigger(modal)} class={commonButtonClasses}>
				<AppCard />
			</button>
		{/if}
		<InstallFromDeviceCard />
	</div>
</div>
