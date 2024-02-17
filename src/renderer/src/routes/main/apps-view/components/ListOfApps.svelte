<script lang="ts">
	import { i18n, trpc } from '$services';

	import type { ExtendedAppInfo } from '../../../../../../types';
	import AppButton from './AppButton.svelte';
	import BaseButton from './BaseButton.svelte';

	const client = trpc();

	export let installedApps: ExtendedAppInfo[];
	export let isSearchInputFilled = false;
	export let openAppCallback: () => void;

	const openSettings = client.openSettings.createMutation();
	const openApp = client.openApp.createMutation();

	$: isDisabled = (app: ExtendedAppInfo) => 'disabled' in app.appInfo.status;
	$: shouldGreyOut = (index: number) => isSearchInputFilled && index !== 0;
</script>

<div
	class="align-center flex grow justify-center bg-light-background bg-fixed dark:bg-apps-list-dark-gradient"
>
	<div>
		<div class="my-8 grid grid-cols-5 gap-8 scroll-smooth px-2">
			{#each installedApps as app, index}
				<AppButton
					{app}
					isDisabled={isDisabled(app)}
					shouldGreyOut={shouldGreyOut(index)}
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
				onClick={() => $openSettings.mutate()}
			>
				<span class="pt-2 text-xs opacity-50">{$i18n.t('addApps')}</span>
			</BaseButton>
		</div>
	</div>
</div>
