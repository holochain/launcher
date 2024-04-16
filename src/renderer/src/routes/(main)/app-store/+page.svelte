<script lang="ts">
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
</script>

<MainHeader {handlePress} bind:searchInput type={APP_STORE} />

<div class="grow bg-light-background p-4 dark:bg-apps-list-dark-gradient">
	<div class="text-token grid w-full gap-4 md:grid-cols-2">
		{#each $appStoreHappsQuery.isSuccess ? $appStoreHappsQuery.data : [] as app}
			<AppCard icon={app.icon} title={app.title} subtitle={app.subtitle} id={app.id} />
		{/each}
		{#if isKandoInSearch}
			<AppCard />
		{/if}
		<InstallFromDeviceCard />
	</div>
</div>
