<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PRESEARCH_URL_QUERY, SEARCH_URL_QUERY } from '$const';
	import { filterValidateAndSortApps } from '$helpers';
	import { trpc, useFocusRefetch } from '$services';

	import ListOfApps from './components/ListOfApps.svelte';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	onMount(() => {
		const searchQuery = $page.url.searchParams.get(PRESEARCH_URL_QUERY) || '';
		goto(`?${SEARCH_URL_QUERY}=${searchQuery}`);
	});

	useFocusRefetch($installedApps.refetch);

	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';

	$: filteredInstalledApps = filterValidateAndSortApps(searchInput, $installedApps?.data ?? []);
</script>

{#if $installedApps.isSuccess}
	<ListOfApps
		isSearchInputFilled={searchInput !== ''}
		installedApps={filteredInstalledApps}
		openAppCallback={() => {
			goto(`?${SEARCH_URL_QUERY}=`);
		}}
	/>
{/if}
{#if $installedApps.isError}
	<div>Failed to get installed apps: {$installedApps.error.message}</div>
{/if}
