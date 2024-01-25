<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input, ListOfApps, MainHeader } from '$components';
	import { validateApp } from '$helpers';
	import { Home, Rocket } from '$icons';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const installedApps = client.getInstalledApps.createQuery();
	const openApp = client.openApp.createMutation();

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

		if (key === 'Enter' && filteredInstalledApps.length > 0) {
			$openApp.mutate(filteredInstalledApps[0]);
		}

		if (key === 'Tab') {
			event.detail.preventDefault();
			searchInput = autocomplete;
		}
	}

	let searchInput = '';
</script>

<MainHeader
	openSettingsCallback={() => {
		searchInput = '';
	}}
>
	<Button
		props={{
			type: 'button',
			class: 'p-2',
			onClick: () => {
				goto('/main/app-store');
			}
		}}
	>
		<Home fillColor="white" />
	</Button>
	<div class="relative mx-2 flex-grow">
		<Input
			bind:value={searchInput}
			on:keydown={handlePress}
			props={{
				class: 'pl-10 input rounded placeholder-tertiary-500 text-base font-medium',
				type: 'text',
				placeholder: $i18n.t('whatDoYouWantToLaunch'),
				autofocus: true
			}}
		/>
		<div class="absolute left-2 top-2 z-10">
			<Rocket />
		</div>
	</div>
</MainHeader>
{#if $installedApps.isSuccess}
	<ListOfApps
		installedApps={filteredInstalledApps}
		openAppCallback={() => {
			searchInput = '';
		}}
	/>
{/if}
