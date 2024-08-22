<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';
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
		initializeDefaultAppPorts,
		isDev,
		setSearchInput,
		showModalError
	} from '$helpers';
	import { Gear, Home, ResizeIcon, Rocket } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { APP_STORE, APPS_VIEW } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';

	const client = trpc();

	const { checkForAppUiUpdatesQuery } = createAppQueries();

	const installedApps = client.getInstalledApps.createQuery();
	const launcherVerion = client.getLauncherVersion.createQuery();

	const openApp = client.openApp.createMutation();
	const hideApp = client.hideApp.createMutation();
	const openSettings = client.openSettings.createMutation();

	const utils = client.createUtils();

	const modalStore = getModalStore();

	client.refetchDataSubscription.createSubscription(undefined, {
		onData: (data) => {
			if (data) {
				$installedApps.refetch();
				$uiUpdates.refetch();
			}
		}
	});

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
			.filter(filterHash) ?? [],
		isDev()
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
	const initializeAppPorts = async () => {
		try {
			const initializeDefaultAppPortsData = await utils.initializeDefaultAppPorts.fetch();
			initializeDefaultAppPorts(initializeDefaultAppPortsData);
		} catch (error) {
			showModalError({
				modalStore,
				errorTitle: $i18n.t('setupError'),
				errorMessage: $i18n.t(getErrorMessage(error))
			});
		}
	};

	onMount(() => {
		window.addEventListener('keydown', handleEscapeKey);
		initializeAppPorts();

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
		<div class={clsx('absolute z-10', type === APPS_VIEW ? 'left-2 top-2' : 'left-1 top-1')}>
			{#if type === APPS_VIEW}
				<Rocket fillColor={SELECTED_ICON_STYLE} />
			{:else}
				<Home fillColor={SELECTED_ICON_STYLE} />
			{/if}
		</div>
	</div>
	{#if type !== APP_STORE}
		<IconButton onClick={handleNavigation(APP_STORE)} buttonClass="ml-auto group">
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
<div class="absolute bottom-[0.3rem] right-[0.3rem]">
	<ResizeIcon />
</div>
{#if $launcherVerion.isSuccess}
	<p class="absolute bottom-0 left-0 p-1 text-xs opacity-30">
		{$launcherVerion.data}
	</p>
{/if}
