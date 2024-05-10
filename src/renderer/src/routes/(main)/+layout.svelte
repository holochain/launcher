<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { IconButton, Input, TopBar } from '$components';
	import { SEARCH_URL_QUERY, SELECTED_ICON_STYLE } from '$const';
	import {
		filterHash,
		filterValidateAndSortApps,
		getAppStoreDistributionHash,
		handleNavigationWithAnimationDelay,
		setSearchInput
	} from '$helpers';
	import { Gear, Home, Rocket } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { APP_STORE, APPS_VIEW } from '$shared/const';

	const client = trpc();

	const { checkForAppUiUpdatesQuery } = createAppQueries();

	const hideApp = client.hideApp.createMutation();
	const installedApps = client.getInstalledApps.createQuery();
	const openApp = client.openApp.createMutation();

	const openSettings = client.openSettings.createMutation();

	let inputExpanded = false;

	$: searchInput = $page.url.searchParams.get(SEARCH_URL_QUERY) || '';

	$: filteredInstalledApps = filterValidateAndSortApps(searchInput, $installedApps?.data ?? []);

	$: type = $page.url.pathname.includes(`/${APP_STORE}/`)
		? 'other'
		: $page.url.pathname.includes(APP_STORE)
			? APP_STORE
			: APPS_VIEW;

	$: autocomplete =
		type === APPS_VIEW && filteredInstalledApps.length > 0
			? filteredInstalledApps[0].appInfo.installed_app_id
			: '';

	$: if (type) inputExpanded = true;

	$: uiUpdates = checkForAppUiUpdatesQuery(
		$installedApps?.data
			?.map((app) => getAppStoreDistributionHash(app.distributionInfo))
			.filter(filterHash) ?? []
	);

	const handleNavigation = handleNavigationWithAnimationDelay(() => (inputExpanded = false));

	const handlePress = (event: CustomEvent): void => {
		if (!(event.detail instanceof KeyboardEvent)) return;

		const { key } = event.detail;
		const hasApps = filteredInstalledApps.length > 0;

		if (key === 'Enter' && type === APPS_VIEW && hasApps && searchInput !== '') {
			$openApp.mutate(filteredInstalledApps[0]);
			return;
		}

		if (key === 'Tab' && type === APPS_VIEW) {
			event.detail.preventDefault();
			goto(`?${SEARCH_URL_QUERY}=${autocomplete}`);
			return;
		}

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			goto(`?${SEARCH_URL_QUERY}=`);
		}
	};

	const handleEscapeKey = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			$hideApp.mutate();
			goto(`/${APPS_VIEW}`);
		}
	};

	onMount(() => {
		window.addEventListener('keydown', handleEscapeKey);

		return () => {
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});
</script>

<TopBar>
	{#if type !== APPS_VIEW}
		<IconButton onClick={handleNavigation(APPS_VIEW)}><Rocket /></IconButton>
	{/if}
	<div
		class="app-region-no-drag relative mx-2 max-w-md flex-grow origin-left transition-transform"
		class:duration-{ANIMATION_DURATION}={inputExpanded}
		class:scale-x-100={inputExpanded}
		class:scale-x-0={!inputExpanded}
	>
		<Input
			value={searchInput}
			bind:autocomplete
			on:keydown={handlePress}
			on:input={setSearchInput}
			props={{
				class: 'pl-10 input rounded text-base font-medium',
				type: 'text',
				placeholder:
					type === APP_STORE ? $i18n.t('whatDoYouWantToInstall') : $i18n.t('searchForApps'),
				autofocus: true
			}}
		/>
		<div class="absolute left-2 top-2 z-10">
			{#if type === APPS_VIEW}
				<Rocket fillColor={SELECTED_ICON_STYLE} />
			{:else}
				<Home fillColor={SELECTED_ICON_STYLE} />
			{/if}
		</div>
	</div>
	{#if type !== APP_STORE}
		<IconButton onClick={handleNavigation(APP_STORE)} buttonClass="ml-auto">
			<Home />
		</IconButton>
	{/if}
	<IconButton onClick={() => $openSettings.mutate(undefined)}>
		<div class="relative">
			<Gear />
			{#if Object.values($uiUpdates.data ?? {}).some(Boolean)}
				<div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-warning-500"></div>
			{/if}
		</div>
	</IconButton>
</TopBar>

<div class="grow overflow-y-auto bg-light-background px-4 dark:bg-apps-list-dark-gradient">
	<slot />
</div>
