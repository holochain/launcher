<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { initializeDefaultAppPorts, showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';
	import { getErrorMessage } from '$shared/helpers';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();

	let passwordInput = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const utils = client.createUtils();

	const handleError = (errorMessage: string) => {
		showModalError({
			modalStore,
			errorTitle: $i18n.t('setupError'),
			errorMessage
		});
	};

	const loginAndLaunch = () => {
		$launch.mutate(
			{ password: passwordInput },
			{
				onSuccess: async () => {
					try {
						const initializeDefaultAppPortsData = await utils.initializeDefaultAppPorts.fetch();
						await initializeDefaultAppPorts(initializeDefaultAppPortsData);
						goto(`/${APPS_VIEW}`);
					} catch (error) {
						handleError($i18n.t(getErrorMessage(error)));
					}
				},
				onError: (error) => handleError($i18n.t(error.message || 'unknownError'))
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
