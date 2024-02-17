<script lang="ts">
	import { AppStore } from '../../../../../types';
	import MainHeader from '../components/MainHeader.svelte';
	import AppCard from './components/AppCard.svelte';
	import InstallFromDeviceCard from './components/InstallFromDeviceCard.svelte';

	export let searchInput: string = '';

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

<MainHeader {handlePress} bind:searchInput type={AppStore} />

<div class="grow bg-light-background p-4 dark:bg-apps-list-dark-gradient">
	<div class="text-token grid w-full gap-4 md:grid-cols-2">
		{#if isKandoInSearch}
			<AppCard />
		{/if}
		<InstallFromDeviceCard />
	</div>
</div>
