<script lang="ts">
	import { goto } from '$app/navigation';
	import { IconButton } from '$components';
	import { BackArrow } from '$icons';
	import { i18n } from '$services';
	import { recoveryKeysPassphrase } from '$stores';

	import { PasswordForm } from '../components';
</script>

<div
	class="app-region-drag fixed left-0 right-0 top-0 flex items-center justify-between bg-[#DADADA12] p-3"
>
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton buttonClass="absolute left-2" onClick={() => goto('advanced-setup-step-3')}
			><BackArrow /></IconButton
		>
		<span class="text-semibold text-center text-lg text-white">Advanced Setup (4 / 6)</span>
	</div>
</div>

<h1 class="h1 mb-10">2. Generate Recovery Keys</h1>

<h2 class="h2 mb-4 max-w-[380px]">Choose a secure passphrase to encrypt your recovery keys:</h2>

<PasswordForm
	bind:value={$recoveryKeysPassphrase}
	placeholderText={$i18n.t('chooseAPassphrase')}
	buttonAction={() => goto('advanced-setup-step-5')}
	isDisabled={$recoveryKeysPassphrase.length < 1}
	wide
/>
<p class="text-xs font-semibold leading-[0.5] opacity-50">
	{$i18n.t('passphrase').toUpperCase()}
</p>
