<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { Button, Input } from '$components';
	import { Gear, Home, Rocket } from '$icons';
	import { i18n, trpc } from '$services';
	import { type AppHeader, AppStore, AppsView } from '$types';

	const client = trpc();

	const openSettings = client.openSettings.createMutation();

	export let handlePress: (event: CustomEvent) => void = () => {};
	export let autocomplete: string | null = null;
	export let searchInput: string;

	const animationDuration = 300;

	export let type: AppHeader;

	let inputExpanded = false;

	onMount(() => {
		inputExpanded = true;
	});

	const clearSearchInput = () => (searchInput = '');
	const handleNavigationWithAnimationDelay = (destination: string) => () => {
		inputExpanded = false;
		setTimeout(() => goto(destination), animationDuration);
	};
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	{#if type == AppsView}
		<Button
			props={{
				class: 'p-2 app-region-no-drag',
				onClick: handleNavigationWithAnimationDelay('app-store')
			}}
		>
			<Home />
		</Button>
	{/if}

	<div
		class="app-region-no-drag relative mx-2 max-w-md flex-grow origin-left transition-transform"
		class:duration-{animationDuration}={inputExpanded}
		class:scale-x-100={inputExpanded}
		class:scale-x-0={!inputExpanded}
	>
		<Input
			bind:value={searchInput}
			bind:autocomplete
			on:keydown={handlePress}
			props={{
				class: 'pl-10 input rounded text-base font-medium',
				type: 'text',
				placeholder:
					type === AppStore ? $i18n.t('whatDoYouWantToInstall') : $i18n.t('searchForApps'),
				autofocus: true
			}}
		/>
		<div class="absolute left-2 top-2 z-10">
			{#if type === AppsView}
				<Rocket fillColor="fill-light-primary dark:fill-white" />
			{:else}
				<Home fillColor="fill-light-primary dark:fill-white" />
			{/if}
		</div>
	</div>
	{#if type == AppStore}
		<Button
			props={{
				class: 'p-2 mr-2 ml-auto app-region-no-drag',
				onClick: handleNavigationWithAnimationDelay('apps-view')
			}}
		>
			<Rocket />
		</Button>
	{/if}
	<Button
		props={{
			class: 'app-region-no-drag',
			onClick: () =>
				$openSettings.mutate(undefined, {
					onSuccess: clearSearchInput
				})
		}}
	>
		<Gear />
	</Button>
</div>
