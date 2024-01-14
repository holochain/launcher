<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { PasswordForm } from '$components';
	import { showModalError } from '$helpers';
	import { Warning } from '$icons';
	import { i18n, trpc } from '$services';
	import { appPassword } from '$stores';

	const modalStore = getModalStore();

	const client = trpc();

	const setupAndLaunch = client.handleSetupAndLaunch.createMutation();

	let confirmPasswordInput = '';
	let setupProgress = '';

	const signupAndLaunch = () => {
		if ($appPassword !== confirmPasswordInput) {
			return handleError($i18n.t('passwordsDontMatch'));
		}

		$setupAndLaunch.mutate(
			{ password: $appPassword },
			{
				onSuccess: () => {
					goto('/app');
				},
				onError: (error) => handleError($i18n.t(error.message || 'unknownError'))
			}
		);
	};

	function handleError(errorMessage: string) {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('setupError'),
			errorMessage: errorMessage
		});

		setupProgress = '';
	}

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			setupProgress = data;
		}
	});
</script>

{#if setupProgress}
	<h2 class="h2">{$i18n.t(setupProgress)}</h2>
{:else}
	<p class="text-base font-semibold leading-[0.5] opacity-50">2 {$i18n.t('of')} 2</p>
	<h2 class="h2">{$i18n.t('confirmYourPassword')}</h2>
	<div class="py-2">
		<Warning />
	</div>
	<p class="mb-4 max-w-72 font-[450] text-error-500">
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
{/if}
