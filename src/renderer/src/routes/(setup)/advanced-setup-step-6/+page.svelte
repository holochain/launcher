<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button, IconButton } from '$components';
	import { resizeWindowAndNavigate } from '$helpers';
	import { BackArrow, Download } from '$icons';
	import Warning from '$icons/Warning.svelte';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/const';
	import {
		appPassword,
		generatedKeyRecoveryFile,
		recoveryKeysPassphrase,
		setupProgress
	} from '$stores';

	import { SetupProgressWrapper } from '../components';

	const client = trpc();

	const toastStore = getToastStore();

	const generateAndExportKeysMutation = client.generateAndExportKeyRecoveryFile.createMutation();
	const advancedSetup = client.advancedSetup.createMutation();
	const launch = client.launch.createMutation();

	let launching = false;
	let generating = false;

	const generateAndExportKeys = () => {
		generating = true;
		$generateAndExportKeysMutation.mutate($recoveryKeysPassphrase, {
			onSuccess: (keyFile) => {
				$generatedKeyRecoveryFile = keyFile;
				generating = false;
				toastStore.trigger({
					message: 'Key Recovery File exported.',
					background: 'variant-filled-success'
				});
			},
			onError: async (error) => {
				setupProgress.set('');
				console.error(error);
				generating = false;
				toastStore.trigger({
					message: `Failed to generate and export key recovery file: ${error.message}`,
					background: 'variant-filled-error'
				});
			}
		});
	};

	const launchIt = async () => {
		const deviceSeed = $generatedKeyRecoveryFile?.deviceSeed0;
		if (!deviceSeed) {
			toastStore.trigger({
				message: 'Device seed undefined',
				background: 'variant-filled-error'
			});
			return;
		}

		launching = true;
		generating = false;

		try {
			await $advancedSetup.mutateAsync({
				password: $appPassword,
				lockedDeviceSeed: deviceSeed,
				lockedSeedPassphrase: $recoveryKeysPassphrase
			});
		} catch (error) {
			setupProgress.set('');
			launching = false;
			console.error(error);
			toastStore.trigger({
				message: $i18n.t((error as Error).message || 'unknownError'),
				background: 'variant-filled-error'
			});
			return;
		}

		try {
			await $launch.mutateAsync({ password: $appPassword });
			$appPassword = '';
			$recoveryKeysPassphrase = '';
			resizeWindowAndNavigate(APP_STORE);
		} catch (error) {
			launching = false;
			console.error(error);
			setupProgress.set('');
			toastStore.trigger({
				message: $i18n.t((error as Error).message || 'unknownError'),
				background: 'variant-filled-error'
			});
		}
		launching = false;
	};
</script>

<SetupProgressWrapper>
	{#if !launching}
		<div
			class="app-region-drag fixed left-0 right-0 top-0 flex items-center justify-between bg-[#DADADA12] p-3"
		>
			<div class="relative flex w-full items-center justify-center py-[11px]">
				{#if !$generatedKeyRecoveryFile}
					<IconButton
						buttonClass="absolute left-2"
						onClick={() => {
							$recoveryKeysPassphrase = '';
							goto('advanced-setup-step-4');
						}}><BackArrow /></IconButton
					>
				{/if}
				<span class="text-semibold text-center text-lg text-white">Advanced Setup (6 / 6)</span>
			</div>
		</div>
	{/if}
	<h1 class="h1 mb-10">{$i18n.t('Final Step: Export your Key Recovery File')}</h1>

	<div class="pb-2">
		<Warning />
	</div>
	<p class="mb-2 max-w-72 font-[450] leading-tight text-warning-500">
		{$i18n.t('Export this recovery file to a secure location - for example an external USB drive.')}
	</p>
	<p class="mb-8 max-w-72 font-[450] leading-tight text-warning-500">
		{$i18n.t('You CANNOT export this file later if you lose it.')}
	</p>

	<Button
		props={{
			class: 'btn-black flex mb-20',
			onClick: () => generateAndExportKeys(),
			disabled: generating || !!$generatedKeyRecoveryFile,
			isLoading: $generateAndExportKeysMutation.isPending
		}}
	>
		<div class="mr-2"><Download /></div>
		{$i18n.t('Export Key Recovery File')}
	</Button>

	<Button
		props={{
			onClick: () => launchIt(),
			disabled: !$generatedKeyRecoveryFile
		}}
	>
		{$i18n.t('Launch!')}
	</Button>
</SetupProgressWrapper>
