<script lang="ts">
	import { onMount } from 'svelte';

	import { page } from '$app/stores';
	import { validateApp } from '$helpers';
	import { trpc } from '$services';
	import { APPS_VIEW } from '$shared/types';

	import MainHeader from '../components/MainHeader.svelte';
	import ListOfApps from './components/ListOfApps.svelte';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
	const openApp = client.openApp.createMutation();

	let searchInput = '';

	onMount(() => {
		searchInput = $page.url.searchParams.get('presearch') || '';
	});

	$: filteredInstalledApps =
		$installedApps?.data
			?.filter((app) =>
				app.appInfo.installed_app_id.toLowerCase().includes(searchInput.toLowerCase())
			)
			.filter(validateApp) ?? [];

	$: autocomplete =
		filteredInstalledApps.length > 0 ? filteredInstalledApps[0].appInfo.installed_app_id : '';

	function handlePress(event: CustomEvent) {
		if (!(event.detail instanceof KeyboardEvent)) return;

		const { key } = event.detail;
		const hasApps = filteredInstalledApps.length > 0;

		if (key === 'Enter' && hasApps && searchInput !== '') {
			$openApp.mutate(filteredInstalledApps[0]);
			return;
		}

		if (key === 'Tab') {
			event.detail.preventDefault();
			searchInput = autocomplete;
			return;
		}

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			searchInput = '';
		}
	}
</script>

<MainHeader {handlePress} bind:searchInput type={APPS_VIEW} bind:autocomplete />

{#if $installedApps.isSuccess}
	<ListOfApps
		isSearchInputFilled={searchInput !== ''}
		installedApps={filteredInstalledApps}
		openAppCallback={() => {
			searchInput = '';
		}}
	/>
{/if}
