<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { page } from '$app/stores';
	import { SEARCH_URL_QUERY } from '$const';
	import {
		filterAppsBySearchAndAllowlist,
		filterOutDenylisted,
		getAllowlistKeys,
		isDev,
		uint8ArrayToURIComponent
	} from '$helpers';
	import { Eye } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { hideUnverifiedApps } from '$stores';

	import { AppCard, InstallFromDeviceCard } from './components';
	const { appStoreHappsQuery, fetchAllowlistQuery } = createAppQueries();

	const allowlist = fetchAllowlistQuery(isDev());

	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';
	$: searchInputLower = searchInput.toLowerCase();

	$: isKandoInSearch = 'kando'.includes(searchInputLower);

	$: allowlistKeys = getAllowlistKeys($allowlist?.data);
	$: filteredApps = filterOutDenylisted($appStoreHappsQuery?.data ?? [], $allowlist?.data);
	$: verifiedApps = filterAppsBySearchAndAllowlist(filteredApps, searchInput, allowlistKeys);
	$: unverifiedApps = (filteredApps ?? []).filter((app) => !verifiedApps.includes(app));
</script>

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
	<!-- {#if isKandoInSearch}
		<AppCard />
	{/if} -->
	<InstallFromDeviceCard />
</div>

{#if unverifiedApps.length > 0}
	<div class="flex w-full flex-row items-center justify-center">
		<div class="w-full border-t border-dashed border-gray-500"></div>
		<button
			on:click={() => ($hideUnverifiedApps = !$hideUnverifiedApps)}
			class="flex flex-row gap-2 whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-xs text-gray-300 hover:text-white"
		>
			<Eye />{$i18n.t(
				$hideUnverifiedApps
					? unverifiedApps.length === 1
						? 'viewUnverifiedApp'
						: 'viewUnverifiedApps'
					: 'hideUnverifiedApps',
				{
					amount: unverifiedApps.length
				}
			)}
		</button>
		<div class="w-full border-t border-dashed border-gray-500"></div>
	</div>
	{#if !$hideUnverifiedApps}
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

{#if $allowlist.isLoading || $allowlist.isError || $appStoreHappsQuery.isFetching}
	<div class="absolute bottom-0 right-6 flex items-center p-1 text-xs opacity-50">
		{#if $appStoreHappsQuery.isFetching || $allowlist.isLoading}
			<ProgressRadial width="w-3" stroke={100} />
		{/if}
		<p class="ml-2">
			{$i18n.t(
				$appStoreHappsQuery.isFetching
					? 'pollingForNewApps'
					: $allowlist.isLoading
						? 'allowListLoading'
						: 'allowListError'
			)}
		</p>
	</div>
{/if}
