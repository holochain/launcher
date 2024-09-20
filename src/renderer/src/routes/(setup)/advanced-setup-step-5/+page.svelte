<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { IconButton } from '$components';
	import { BackArrow } from '$icons';
	import Warning from '$icons/Warning.svelte';
	import { i18n } from '$services';
	import { recoveryKeysPassphrase } from '$stores';

	import { PasswordForm } from '../components';

	let toastStore = getToastStore();

	let confirmPassphraseInput = '';
</script>

<div
	class="app-region-drag bg-transparent-gray fixed left-0 right-0 top-0 flex items-center justify-between p-3"
>
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton
			buttonClass="absolute left-2"
			onClick={() => {
				$recoveryKeysPassphrase = '';
				goto('advanced-setup-step-4');
			}}><BackArrow /></IconButton
		>
		<span class="text-semibold text-center text-lg text-white">Advanced Setup (5 / 6)</span>
	</div>
</div>

<h1 class="h1 mb-10">2. Generate Recovery Keys</h1>

<div class="pb-2">
	<Warning />
</div>
<p class="mb-4 max-w-72 font-[450] leading-tight text-warning-500">
	{$i18n.t(
		'If you loose this passphrase, you will not be able to recover your private keys in case you lose access to this device'
	)}
</p>

<h2 class="h2 mb-4">{$i18n.t('confirmPassphrase')}:</h2>

<PasswordForm
	bind:value={confirmPassphraseInput}
	placeholderText={$i18n.t('confirmPassphrase')}
	buttonAction={() => {
		if ($recoveryKeysPassphrase !== confirmPassphraseInput) {
			toastStore.trigger({
				message: $i18n.t('passphrasesDontMatch'),
				background: 'variant-filled-error'
			});
			return;
		}
		goto('advanced-setup-step-6');
	}}
	isDisabled={confirmPassphraseInput.length < 1}
	wide
/>
