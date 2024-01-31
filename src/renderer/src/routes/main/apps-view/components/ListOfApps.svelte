<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { i18n, trpc } from '$services';

	import type { ExtendedAppInfo } from '../../../../../../types';
	import TooltipForTruncate from './TooltipForTruncate.svelte';

	const client = trpc();

	export let installedApps: ExtendedAppInfo[];
	export let isSearchInputFilled = false;
	export let openAppCallback: () => void;

	const openSettings = client.openSettings.createMutation();
	const openApp = client.openApp.createMutation();
</script>

<div class="align-center bg-apps-list-dark-gradient flex grow justify-center bg-fixed">
	<div
		class="flex snap-x snap-mandatory scroll-px-4 gap-4 self-center overflow-x-auto scroll-smooth px-4 pt-4"
	>
		{#each installedApps as app, index}
			{@const isDisabled = 'disabled' in app.appInfo.status}
			{@const shouldGreyOut = isSearchInputFilled && index !== 0}
			<button
				class:cursor-not-allowed={isDisabled}
				class:opacity-50={isDisabled || shouldGreyOut}
				class="flex w-20 snap-start flex-col items-center"
				on:click={() => {
					if (!isDisabled)
						$openApp.mutate(app, {
							onSuccess: () => {
								openAppCallback();
							}
						});
				}}
			>
				<Avatar
					initials={app.appInfo.installed_app_id}
					rounded="rounded-2xl"
					background="bg-app-gradient"
				/>
				<TooltipForTruncate text={app.appInfo.installed_app_id} />
			</button>
		{/each}
		<button
			class="flex w-20 shrink-0 snap-start flex-col items-center"
			on:click={() => $openSettings.mutate()}
		>
			<Avatar
				border="border-4 border-white border-opacity-20"
				fontSize={250}
				fill="fill-white opacity-50"
				initials="+"
				rounded="rounded-2xl"
				background="bg-transparent"
			/>
			<span class="pt-2 text-xs opacity-50">{$i18n.t('addApps')}</span>
		</button>
	</div>
</div>
