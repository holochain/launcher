<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';
	import { APPS_VIEW } from '$shared/const';

	import { PasswordForm, SetupProgressWrapper } from '../components';

	const modalStore = getModalStore();

	let passwordInput = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const factoryReset = client.factoryReset.createMutation();

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
				onSuccess: () => goto(`/${APPS_VIEW}`),
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
	<button
		on:click={() => {
			$factoryReset.mutate(
				undefined,
				{
					onError: (error) =>
						showModalError({
							modalStore,
							errorTitle: $i18n.t('factoryResetError'),
							errorMessage: error.message
						})
				}
			);
		}}>Factory Reset</button
	>
</SetupProgressWrapper>
