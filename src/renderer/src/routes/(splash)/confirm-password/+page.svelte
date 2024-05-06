<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { initializeDefaultAppPorts, showModalError } from '$helpers';
	import { ArrowLeft, Warning } from '$icons';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';
	import { appPassword } from '$stores';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();

	const client = trpc();

	const utils = client.createUtils();

	const setupAndLaunch = client.handleSetupAndLaunch.createMutation();

	let confirmPasswordInput = '';

	const handleError = (errorMessage: string) => {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('setupError'),
			errorMessage
		});
	};

	const signupAndLaunch = () => {
		if ($appPassword !== confirmPasswordInput) {
			return handleError($i18n.t('passwordsDontMatch'));
		}

		$setupAndLaunch.mutate(
			{ password: $appPassword },
			{
				onSuccess: async () => {
					try {
						const initializeDefaultAppPortsData = await utils.initializeDefaultAppPorts.fetch();
						await initializeDefaultAppPorts(initializeDefaultAppPortsData);
						goto(`/${APP_STORE}`);
					} catch (error) {
						handleError($i18n.t(getErrorMessage(error)));
					}
				},
				onError: (error) => handleError($i18n.t(error.message || 'unknownError'))
			}
		);
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
