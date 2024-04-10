<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { IconButton, Input } from '$components';
	import { SELECTED_ICON_STYLE } from '$const';
	import { Gear, Home, Rocket } from '$icons';
	import { i18n, trpc } from '$services';
	import { ANIMATION_DURATION, APP_STORE, APPS_VIEW } from '$shared/const';
	import { type MainScreenRoute } from '$shared/types';
	import { navigationStore } from '$stores';

	const client = trpc();

	const openSettings = client.openSettings.createMutation();

	export let handlePress: (event: CustomEvent) => void = () => {};
	export let autocomplete: string | null = null;
	export let searchInput: string;

	export let type: MainScreenRoute;

	let inputExpanded = false;

	onMount(() => {
		inputExpanded = true;

		return navigationStore.subscribe((value) => {
			if (value !== null) {
				handleNavigationWithAnimationDelay(value)();
				navigationStore.set(null);
			}
		});
	});

	const clearSearchInput = () => (searchInput = '');
	const handleNavigationWithAnimationDelay = (destination: MainScreenRoute) => () => {
		inputExpanded = false;
		setTimeout(() => goto(destination), ANIMATION_DURATION);
	};
</script>

<div class="app-region-drag flex justify-between p-3 dark:bg-apps-input-dark-gradient">
	{#if type === APPS_VIEW}
		<IconButton onClick={handleNavigationWithAnimationDelay(APP_STORE)}><Home /></IconButton>
	{/if}

	<div
		class="app-region-no-drag relative mx-2 max-w-md flex-grow origin-left transition-transform"
		class:duration-{ANIMATION_DURATION}={inputExpanded}
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
	{#if type == APP_STORE}
		<IconButton onClick={handleNavigationWithAnimationDelay(APPS_VIEW)} buttonClass="ml-auto">
			<Rocket />
		</IconButton>
	{/if}
	<IconButton
		onClick={() =>
			$openSettings.mutate(undefined, {
				onSuccess: clearSearchInput
			})}
	>
		<Gear />
	</IconButton>
</div>
