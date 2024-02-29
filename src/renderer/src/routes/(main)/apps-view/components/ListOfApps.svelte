<script lang="ts">
	import { i18n, trpc } from '$services';
	import { navigationStore } from '$stores';

	import { APP_STORE, type ExtendedAppInfo } from '../../../../../../types';
	import AppButton from './AppButton.svelte';
	import BaseButton from './BaseButton.svelte';

	const client = trpc();

	export let installedApps: ExtendedAppInfo[];
	export let isSearchInputFilled = false;
	export let openAppCallback: () => void;

	const openApp = client.openApp.createMutation();
</script>

<div
	class="align-center flex grow justify-center bg-light-background bg-fixed dark:bg-apps-list-dark-gradient"
>
	<div>
		<div class="my-8 grid grid-cols-5 gap-8 scroll-smooth px-2">
			{#each installedApps as app, index}
				<AppButton
					{index}
					{app}
					{isSearchInputFilled}
					onClick={() =>
						$openApp.mutate(app, {
							onSuccess: () => {
								openAppCallback();
							}
						})}
				/>
			{/each}
			<BaseButton
				fontSize={250}
				fill="fill-white opacity-50"
				initials="+"
				onClick={() => navigationStore.set(APP_STORE)}
			>
				<span class="pt-2 text-xs opacity-50">{$i18n.t('addApps')}</span>
			</BaseButton>
		</div>
	</div>
</div>
