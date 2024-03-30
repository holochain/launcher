<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ADD_APP_PAGE, SYSTEM_INFORMATION, SYSTEM_SETTINGS } from '$const';
	import { initializeAppPortSubscription, validateApp } from '$helpers';
	import { Plus } from '$icons';
	import { i18n, trpc } from '$services';

	import { MenuEntry, TopBar } from './components';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	const selectView = (view: string) => goto(`/settings${view ? `?view=${view}` : ''}`);

	$: view = $page.url.searchParams.get('view');

	const systemViews = [SYSTEM_INFORMATION, SYSTEM_SETTINGS];

	const appPort = client.getAppPort.createQuery();

	$: isAddAppPage = $page.url.pathname.endsWith(ADD_APP_PAGE);

	onMount(() => {
		initializeAppPortSubscription(appPort);
	});
</script>

<TopBar />
<div
	class="grid h-full w-full grid-cols-[35%_1fr] bg-light-background bg-fixed dark:bg-settings-dark-gradient"
>
	<div
		class="grid grid-rows-[auto_1fr_auto] bg-light-background bg-fixed shadow-3xl dark:bg-settings-dark-gradient"
	>
		<div class="space-y-4 overflow-y-auto p-4">
			<div class="flex flex-col space-y-1">
				{#if isAddAppPage}
					<MenuEntry
						background="bg-app-button-gradient"
						name={$i18n.t('addhApp')}
						onClick={() => goto(`/settings/${ADD_APP_PAGE}`)}
						isSelected={true}
					>
						<div slot="leading" class="pr-2">
							<Plus />
						</div>
					</MenuEntry>
				{/if}
				{#each systemViews as systemView}
					<MenuEntry
						name={$i18n.t(systemView)}
						onClick={() => selectView(systemView)}
						isSelected={!isAddAppPage &&
							(view === systemView || (!view && systemView === SYSTEM_INFORMATION))}
					/>
				{/each}
				<div class="!my-2 h-px w-full bg-tertiary-800"></div>
				{#if $installedApps.isLoading}
					<p>{$i18n.t('loading')}</p>
				{:else if $installedApps.isSuccess}
					{#each $installedApps.data.filter(validateApp) as app (app.appInfo.installed_app_id)}
						<MenuEntry
							isApp
							name={app.appInfo.installed_app_id}
							onClick={() => selectView(app.appInfo.installed_app_id)}
							isSelected={view === app.appInfo.installed_app_id}
						/>
					{/each}
				{/if}
			</div>
		</div>
	</div>
	<div class="grid-row-[1fr_auto] grid p-4">
		<slot />
	</div>
</div>
