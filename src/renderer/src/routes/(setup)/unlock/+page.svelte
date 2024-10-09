<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { MODAL_FACTORY_RESET_CONFIRMATION, MODAL_STARTUP_ERROR } from '$const';
	import { createModalParams, showModalError } from '$helpers';
	import { LauncherPersistedStore } from '$helpers/launcherPersistedStore';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';
	import { WRONG_PASSWORD } from '$shared/types';
	import { appPassword, setupProgress } from '$stores';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let passwordInput = '';

	const client = trpc();

	const deviceSeedPresentMutation = client.dpkiDeviceSeedPresent.createMutation();
	const launch = client.launch.createMutation();
	const quickSetup = client.quickSetup.createMutation();

	const factoryReset = client.factoryReset.createMutation();

	const loginAndLaunch = async () => {
		const deviceSeedPresent = await $deviceSeedPresentMutation.mutateAsync({
			password: passwordInput
		});

		// If there is no device seed present, we need to first create it. If the user
		// has previously chosen "Quick Setup", we can do so automatically, otherwise
		// we will redirect to the "incomplete-setup" page and allow to continue with
		// the advanced setup
		if (!deviceSeedPresent) {
			const quickSetupChosen = await new LauncherPersistedStore().quickSetupChosen.value();
			if (quickSetupChosen) {
				try {
					await $quickSetup.mutateAsync({
						password: passwordInput
					});
				} catch (error: unknown) {
					setupProgress.set('');
					showStartupErrorModal($i18n.t((error as Error).message || 'unknownError'));
					return;
				}
			} else {
				appPassword.set(passwordInput);
				setupProgress.set('');
				goto('incomplete-setup');
				return;
			}
		}

		$launch.mutate(
			{ password: passwordInput },
			{
				onSuccess: () => {
					$appPassword = '';
					passwordInput = '';
					goto(`/${APPS_VIEW}`);
					setupProgress.set('');
				},
				onError: (error) => {
					if (error.message === WRONG_PASSWORD) {
						passwordInput = '';
						toastStore.trigger({
							message: $i18n.t(WRONG_PASSWORD),
							background: 'variant-filled-error'
						});
						setupProgress.set('');
					} else {
						showStartupErrorModal($i18n.t(error.message || 'unknownError'));
					}
				}
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
							errorMessage: $i18n.t(error.message || 'unknownError')
						})
				});
			}
		});

		modalStore.trigger(modal);
	};

	const showStartupErrorModal = (error: string) => {
		const modal = createModalParams(
			MODAL_STARTUP_ERROR,
			(cancel) => {
				if (cancel) goto('/');
			},
			error
		);
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
