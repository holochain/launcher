<script lang="ts">
	import { page } from '$app/stores';
	import { SEARCH_URL_QUERY } from '$const';
	import { uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';

	import { AppCard, InstallFromDeviceCard } from './components';
	const { appStoreHappsQuery } = createAppQueries();

	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';
	$: searchInputLower = searchInput.toLowerCase();

	$: isKandoInSearch = 'kando'.includes(searchInputLower);

	$: filteredAppStoreHapps =
		$appStoreHappsQuery?.data?.filter(({ title }) =>
			title.toLowerCase().includes(searchInputLower)
		) ?? [];
</script>

<div class="grow bg-light-background p-4 dark:bg-apps-list-dark-gradient">
	<div class="text-token grid w-full gap-4 md:grid-cols-2">
		{#each filteredAppStoreHapps as app}
			<AppCard
				icon={app.icon}
				title={app.title}
				subtitle={app.subtitle}
				id={uint8ArrayToURIComponent(app.id)}
			/>
		{/each}
		{#if isKandoInSearch}
			<AppCard />
		{/if}
		<InstallFromDeviceCard />
	</div>
</div>
