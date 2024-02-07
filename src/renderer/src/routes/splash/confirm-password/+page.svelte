<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { showModalError } from '$helpers';
	import { Warning } from '$icons';
	import { i18n, trpc } from '$services';
	import { appPassword } from '$stores';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();

	const client = trpc();

	const setupAndLaunch = client.handleSetupAndLaunch.createMutation();

	let confirmPasswordInput = '';

	const signupAndLaunch = () => {
		if ($appPassword !== confirmPasswordInput) {
			return handleError($i18n.t('passwordsDontMatch'));
		}

		$setupAndLaunch.mutate(
			{ password: $appPassword },
			{
				onSuccess: () => {
					goto('/main/app-store');
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
	}
</script>

<SetupProgressWrapper>
	<p class="text-base font-semibold leading-[0.5] opacity-50">2 {$i18n.t('of')} 2</p>
	<h2 class="h2">{$i18n.t('confirmYourPassword')}</h2>
	<div class="pb-2">
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
	<p class="pb-20 text-xs font-semibold leading-[0.5] opacity-50">
		{$i18n.t('password').toUpperCase()}
	</p>
</SetupProgressWrapper>
