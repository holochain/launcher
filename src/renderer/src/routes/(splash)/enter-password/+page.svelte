<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { MODAL_FACTORY_RESET_CONFIRMATION } from '$const';
	import { createModalParams, showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();

	let passwordInput = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const factoryReset = client.factoryReset.createMutation();

	const loginAndLaunch = () => {
		$launch.mutate(
			{ password: passwordInput },
			{
				onSuccess: () => goto(`/${APPS_VIEW}`),
				onError: (error) =>
					showModalError({
						modalStore,
						errorTitle: $i18n.t('setupError'),
						errorMessage: error.message
					})
			}
		);
	};

	const showModal = () => {
		const modal = createModalParams(MODAL_FACTORY_RESET_CONFIRMATION, (confirm) => {
			if (confirm) {
				$factoryReset.mutate(undefined, {
					onError: (error) =>
						showModalError({
							modalStore,
							errorTitle: $i18n.t('factoryResetError'),
							errorMessage: error.message
						})
				});
			}
		});

		modalStore.trigger(modal);
	};
</script>

<SetupProgressWrapper>
	<h4 class="h4 max-w-56 font-semibold">{$i18n.t('manageAndLaunchApps')}</h4>
	<PasswordForm
		placeholderText={$i18n.t('passwordPlaceholder')}
		buttonAction={loginAndLaunch}
		isDisabled={passwordInput.length < 1 || $launch.isPending}
		bind:value={passwordInput}
	/>
	<button class="pt-4 text-xs font-semibold leading-[0.5] opacity-50" on:click={showModal}>
		{$i18n.t('factoryResetClick')}
	</button>
</SetupProgressWrapper>
