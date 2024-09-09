<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { handleNavigationWithAnimationDelay, showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import { type ExtendedAppInfo } from '$shared/types';

	import AppButton from './AppButton.svelte';
	import BaseButton from './BaseButton.svelte';

	const client = trpc();
	const modalStore = getModalStore();

	export let installedApps: ExtendedAppInfo[];
	export let isSearchInputFilled = false;
	export let openAppCallback: () => void;

	const openApp = client.openApp.createMutation();
</script>

<div class="align-center flex grow justify-center">
	<div>
		<div class="my-8 grid grid-cols-5 gap-8 scroll-smooth">
			{#each installedApps as app, index}
				<AppButton
					{index}
					{app}
					{isSearchInputFilled}
					onClick={() =>
						$openApp.mutate(app, {
							onSuccess: () => {
								openAppCallback();
							},
							onError: (error) => {
								console.error(error);
								showModalError({
									modalStore,
									errorTitle: $i18n.t('appError'),
									errorMessage: $i18n.t(error.message)
								});
							}
						})}
				/>
			{/each}
			<BaseButton
				fontSize={250}
				fill="fill-white opacity-50"
				initials="+"
				onClick={handleNavigationWithAnimationDelay()(APP_STORE)}
			>
				<span class="pt-2 text-xs opacity-50">{$i18n.t('addApp')}</span>
			</BaseButton>
		</div>
	</div>
</div>
