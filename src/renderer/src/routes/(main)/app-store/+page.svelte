<script lang="ts">
	import { APP_STORE } from '../../../../../types';
	import MainHeader from '../components/MainHeader.svelte';
	import { AppCard, InstallFromDeviceCard } from './components';

	let searchInput = '';

	$: isKandoInSearch = 'kando'.includes(searchInput.toLowerCase());

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

<div class="bg-light-background dark:bg-apps-list-dark-gradient grow p-4">
	<div class="text-token grid w-full gap-4 md:grid-cols-2">
		{#if isKandoInSearch}
			<AppCard />
		{/if}
		<InstallFromDeviceCard />
	</div>
</div>
