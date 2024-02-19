<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { validateApp } from '$helpers';
	import { i18n, trpc } from '$services';

	import { MenuEntry, TopBar } from './components';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();

	const selectView = (view: string) => goto(`/settings${view ? `?view=${view}` : ''}`);

	$: view = $page.url.searchParams.get('view');
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
				<MenuEntry
					name={$i18n.t('systemInformation')}
					onClick={() => selectView('')}
					isSelected={!view}
				/>
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
