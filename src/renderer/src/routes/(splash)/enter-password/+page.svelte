<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';

	import { APP_STORE } from '../../../../../types';
	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();

	let passwordInput = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const loginAndLaunch = () => {
		$launch.mutate(
			{ password: passwordInput },
			{
				onSuccess: () => {
					goto(`/${APP_STORE}`);
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
	<h4 class="h4 max-w-56 font-semibold">{$i18n.t('manageAndLaunchApps')}</h4>
	<PasswordForm
		placeholderText={$i18n.t('passwordPlaceholder')}
		buttonAction={loginAndLaunch}
		isDisabled={passwordInput.length < 1 || $launch.isPending}
		bind:value={passwordInput}
	/>
</SetupProgressWrapper>
