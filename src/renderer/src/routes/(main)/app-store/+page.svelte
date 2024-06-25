<script lang="ts">
	import { page } from '$app/stores';
	import { CenterProgressRadial } from '$components';
	import { SEARCH_URL_QUERY } from '$const';
	import { filterApps, getAllowlistKeys, isDev, uint8ArrayToURIComponent } from '$helpers';
	import { Eye } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import { AppCard, InstallFromDeviceCard } from './components';
	const { appStoreHappsQuery, fetchAllowlistQuery } = createAppQueries();

	const allowlist = fetchAllowlistQuery(isDev());

	let hideUnverifiedApps = true;
	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';
	$: searchInputLower = searchInput.toLowerCase();

	$: isKandoInSearch = 'kando'.includes(searchInputLower);

	$: allowlistKeys = getAllowlistKeys($allowlist?.data);
	$: verifiedApps = filterApps($appStoreHappsQuery?.data ?? [], searchInput, allowlistKeys);
	$: unverifiedApps = ($appStoreHappsQuery?.data ?? []).filter(
		(app) => !verifiedApps.includes(app)
	);
</script>

{#if $appStoreHappsQuery.isLoading || $allowlist.isLoading}
	<CenterProgressRadial />
{:else}
	<div class="text-token grid w-full gap-4 py-4 md:grid-cols-2">
		{#each verifiedApps as app}
			<AppCard
				verified
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

	{#if unverifiedApps.length > 0}
		{#if hideUnverifiedApps}
			<div class="flex w-full flex-row items-center justify-center">
				<div class="w-full border-t border-dashed border-gray-500"></div>
				<button
					on:click={() => (hideUnverifiedApps = false)}
					class="flex flex-row gap-2 whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-xs text-gray-300 hover:text-white"
				>
					<Eye />{$i18n.t(
						unverifiedApps.length === 1 ? 'viewUnverifiedApp' : 'viewUnverifiedApps',
						{
							amount: unverifiedApps.length
						}
					)}
				</button>
				<div class="w-full border-t border-dashed border-gray-500"></div>
			</div>
		{:else}
			<div class="grid w-full gap-4 py-4 md:grid-cols-2">
				{#each unverifiedApps as app}
					<AppCard
						verified={false}
						icon={app.icon}
						title={app.title}
						subtitle={app.subtitle}
						id={uint8ArrayToURIComponent(app.id)}
					/>
				{/each}
			</div>
		{/if}
	{/if}
{/if}
