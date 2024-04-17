<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PRESEARCH_URL_QUERY, SEARCH_URL_QUERY } from '$const';
	import { validateApp } from '$helpers';
	import { trpc } from '$services';

	import MainHeader from '../components/MainHeader.svelte';
	import ListOfApps from './components/ListOfApps.svelte';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
	const openApp = client.openApp.createMutation();

	onMount(() => {
		goto(`?${SEARCH_URL_QUERY}=${$page.url.searchParams.get(PRESEARCH_URL_QUERY) || ''}`);
	});

	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';

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
			goto(`?${SEARCH_URL_QUERY}=${autocomplete}`);
			return;
		}

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			goto(`?${SEARCH_URL_QUERY}=`);
		}
	}
</script>

<MainHeader {handlePress} bind:autocomplete />

{#if $installedApps.isSuccess}
	<ListOfApps
		isSearchInputFilled={searchInput !== ''}
		installedApps={filteredInstalledApps}
		openAppCallback={() => {
			goto(`?${SEARCH_URL_QUERY}=`);
		}}
	/>
{/if}
