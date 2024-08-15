<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { createModalParams, resizeWindowAndNavigate, showModalError } from '$helpers';
	import { ArrowLeft, Warning } from '$icons';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import { appPassword } from '$stores';

	import { PasswordForm, SetupProgressWrapper } from '../components';
	import { WRONG_PASSWORD } from '$shared/types';
	import { MODAL_STARTUP_ERROR } from '$const';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const client = trpc();

	const setupAndLaunch = client.handleSetupAndLaunch.createMutation();

	let confirmPasswordInput = '';

	const handleError = (errorMessage: string, response?: (r: unknown) => void) => {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('setupError'),
			errorMessage,
			response
		});
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

	const signupAndLaunch = async () => {
		if ($appPassword !== confirmPasswordInput) {
			toastStore.trigger({
				message: $i18n.t('passwordsDontMatch'),
				background: 'variant-filled-error'
			});
			return;
		}

		try {
			await $setupAndLaunch.mutateAsync({ password: $appPassword });
			$appPassword = '';
			resizeWindowAndNavigate(APP_STORE);
		} catch (error) {
			console.error(error);
			if ((error as Error).message === WRONG_PASSWORD) {
				handleError($i18n.t((error as Error).message || 'unknownError'), () => {
					$appPassword = '';
					goto('/');
				});
			} else {
				showStartupErrorModal($i18n.t((error as Error).message || 'unknownError'));
			}
		}
	};
</script>

{#if !$setupAndLaunch.isPending}
	<div class="absolute left-5 top-5">
		<Button
			props={{
				class: 'btn-secondary z-10 self-start m-4 font-semibold',
				onClick: () => goto('setup-password')
			}}
		>
			<ArrowLeft />
			{$i18n.t('back')}
		</Button>
	</div>
{/if}
<SetupProgressWrapper>
	<p class="text-base font-semibold leading-[0.5] opacity-50">2 {$i18n.t('of')} 2</p>
	<h2 class="h2">{$i18n.t('confirmYourPassword')}</h2>
	<div class="pb-2">
		<Warning />
	</div>
	<p class="mb-4 max-w-72 font-[450] leading-tight text-warning-500">
		{$i18n.t('passwordWarning')}
	</p>
	<PasswordForm
		placeholderText={$i18n.t('confirmPassword')}
		buttonAction={signupAndLaunch}
		bind:value={confirmPasswordInput}
		isDisabled={!confirmPasswordInput || $setupAndLaunch.isPending}
	/>
	<p class="pb-10 text-xs font-semibold leading-[0.5] opacity-50">
		{$i18n.t('password').toUpperCase()}
	</p>
</SetupProgressWrapper>
