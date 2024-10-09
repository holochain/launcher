<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button } from '$components';
	import { resizeWindowAndNavigate } from '$helpers';
	import { LauncherPersistedStore } from '$helpers/launcherPersistedStore';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import { appPassword, setupProgress } from '$stores';

	import { SetupProgressWrapper } from '../components';

	const client = trpc();

	const toastStore = getToastStore();

	const launch = client.launch.createMutation();
	const quickSetup = client.quickSetup.createMutation();

	let launching = false;

	const handleSetupError = (error: unknown) => {
		toastStore.trigger({
			message: $i18n.t((error as Error).message || 'unknownError'),
			background: 'variant-filled-error'
		});
		launching = false;
		setupProgress.set('');
	};

	const signupAndLaunch = async () => {
		launching = true;

		try {
			await $quickSetup.mutateAsync({
				password: $appPassword
			});
		} catch (error) {
			handleSetupError(error);
			return;
		}
		try {
			await $launch.mutateAsync({
				password: $appPassword
			});
			// remove password from memory
			$appPassword = '';
			// Set the quickSetupChosen variable to true which will later be used as a means
			// to determine whether the option to export the Key Recovery File should be displayed
			await new LauncherPersistedStore().quickSetupChosen.set(true);
			resizeWindowAndNavigate(APP_STORE);
		} catch (error) {
			handleSetupError(error);
			goto('unlock');
		}
	};
</script>

<SetupProgressWrapper>
	<h1 class="h1">{$i18n.t('completeYourSetup')}</h1>
	<h4 class="h4 mb-8 mt-6 max-w-96 font-semibold">
		{$i18n.t('restartedWithSetupIncompleteNotice')}
	</h4>
	<Button
		props={{
			onClick: () => {
				window.resizeTo(800, 700);
				window.moveBy(-100, -70);
				goto('advanced-setup-step-3');
			},
			style: 'min-width: 190px; margin-bottom: 15px;',
			disabled: launching
		}}
	>
		{$i18n.t('finishAdvancedSetup')}
	</Button>
	<Button
		props={{
			onClick: () => signupAndLaunch(),
			class: 'btn-black mt-10',
			style: 'min-width: 190px;',
			disabled: launching
		}}
	>
		{$i18n.t('skipAndLaunch')}
	</Button>
</SetupProgressWrapper>
