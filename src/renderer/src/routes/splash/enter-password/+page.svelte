<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { PasswordForm, SetupProgressWrapper } from '$components';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';

	const modalStore = getModalStore();

	let passwordInput = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const loginAndLaunch = () => {
		$launch.mutate(
			{ password: passwordInput },
			{
				onSuccess: () => {
					goto('/app');
				},
				onError: (error) => {
					showModalError({
						modalStore,
						errorTitle: $i18n.t('loginError'),
						errorMessage: $i18n.t(error.message || 'unknownError')
					});
				}
			}
		);
	};
</script>

<SetupProgressWrapper>
	<h3 class="h3 max-w-56 font-semibold">{$i18n.t('manageAndLaunchApps')}</h3>
	<PasswordForm
		placeholderText={$i18n.t('passwordPlaceholder')}
		buttonAction={loginAndLaunch}
		isDisabled={passwordInput.length < 1 || $launch.isPending}
		bind:value={passwordInput}
	/>
</SetupProgressWrapper>
