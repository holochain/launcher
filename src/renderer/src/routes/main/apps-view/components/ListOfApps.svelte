<script lang="ts">
	import { i18n, trpc } from '$services';

	import type { ExtendedAppInfo } from '../../../../../../types';
	import AddAppsButton from './AddAppsButton.svelte';
	import AppButton from './AppButton.svelte';

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
			<AddAppsButton onClick={() => $openSettings.mutate()}>{$i18n.t('addApps')}</AddAppsButton>
		</div>
	</div>
</div>
