<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { IconButton } from '$components';
	import { createModalParams, resizeWindowAndNavigate, showModalError } from '$helpers';
	import { BackArrow, Warning } from '$icons';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import { appPassword } from '$stores';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const toastStore = getToastStore();

	const client = trpc();

	const quickSetup = client.quickSetup.createMutation();
	const launch = client.launch.createMutation();

	let confirmPasswordInput = '';

	let launching = false;

	const signupAndLaunch = async () => {
		launching = true;
		if ($appPassword !== confirmPasswordInput) {
			toastStore.trigger({
				message: $i18n.t('passwordsDontMatch'),
				background: 'variant-filled-error'
			});
			return;
		}

		try {
			await $quickSetup.mutateAsync({
				password: $appPassword
			});
		} catch (error) {
			launching = false;
			console.error(error);
			toastStore.trigger({
				message: $i18n.t((error as Error).message || 'unknownError'),
				background: 'variant-filled-error'
			});
			return;
		}
		try {
			await $launch.mutateAsync({
				password: $appPassword
			});
			// remove password from memory
			$appPassword = '';
			resizeWindowAndNavigate(APP_STORE);
		} catch (error) {
			launching = false;
			console.error(error);
			toastStore.trigger({
				message: $i18n.t((error as Error).message || 'unknownError'),
				background: 'variant-filled-error'
			});
		}
		launching = false;
	};
</script>

{#if !launching}
	<div
		class="app-region-drag fixed left-0 right-0 top-0 flex items-center justify-between bg-[#DADADA12] p-3"
	>
		<div class="relative flex w-full items-center justify-center py-[11px]">
			<IconButton
				buttonClass="absolute left-2"
				onClick={() => {
					$appPassword = '';
					goto('quick-setup-step-1');
				}}><BackArrow /></IconButton
			>

			<span class="text-semibold text-center text-lg text-white">Quick Setup (2 / 2)</span>
		</div>
	</div>
{/if}

<SetupProgressWrapper>
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
		isDisabled={!confirmPasswordInput || launching}
	/>
	<p class="pb-10 text-xs font-semibold leading-[0.5] opacity-50">
		{$i18n.t('password').toUpperCase()}
	</p>
</SetupProgressWrapper>
