<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { IconButton } from '$components';
	import { resizeWindowAndNavigate } from '$helpers';
	import { LauncherPersistedStore } from '$helpers/launcherPersistedStore';
	import { BackArrow, Warning } from '$icons';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import { appPassword, setupProgress } from '$stores';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const toastStore = getToastStore();

	const client = trpc();

	const quickSetup = client.quickSetup.createMutation();
	const launch = client.launch.createMutation();
	const lairSetupRequired = client.lairSetupRequired.createQuery();

	let confirmPasswordInput = '';

	let launching = false;

	let cannotGoBack = window.sessionStorage.getItem('quickSetupFailedHalfway');

	/**
	 * Check at which step launching failed and route accordingly.
	 * If it failed after keystore initialization go to the enter-password ('unlock') screen,
	 * otherwise stay on this screen.
	 */
	const handleErrorAndDetermineRoute = async (error: unknown) => {
		launching = false;
		setupProgress.set('');
		console.error(error);
		toastStore.trigger({
			message: $i18n.t((error as Error).message || 'unknownError'),
			background: 'variant-filled-error'
		});
		const required = await $lairSetupRequired.refetch();
		if (required.isSuccess && required.data === false) {
			const persistedStore = new LauncherPersistedStore();
			await persistedStore.quickSetupChosen.set(true);
			window.sessionStorage.setItem('quickSetupFailedHalfway', 'true');
			cannotGoBack = 'true';
		}
	};

	const signupAndLaunch = async () => {
		launching = true;
		if ($appPassword !== confirmPasswordInput) {
			toastStore.trigger({
				message: $i18n.t('passwordsDontMatch'),
				background: 'variant-filled-error'
			});
			launching = false;
			return;
		}

		try {
			await $quickSetup.mutateAsync({
				password: $appPassword
			});
		} catch (error) {
			await handleErrorAndDetermineRoute(error);
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
			await handleErrorAndDetermineRoute(error);
		}
	};
</script>

{#if !launching && !cannotGoBack}
	<div
		class="app-region-drag bg-transparent-gray fixed left-0 right-0 top-0 flex items-center justify-between p-3"
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
	{#if cannotGoBack}
		<h2 class="h2 mb-4">{$i18n.t('enterPassword')}</h2>
	{:else}
		<h2 class="h2">{$i18n.t('confirmYourPassword')}</h2>
	{/if}
	{#if !cannotGoBack}
		<div class="pb-2">
			<Warning />
		</div>
		<p class="mb-4 max-w-72 font-[450] leading-tight text-warning-500">
			{$i18n.t('passwordWarning')}
		</p>
	{/if}
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
