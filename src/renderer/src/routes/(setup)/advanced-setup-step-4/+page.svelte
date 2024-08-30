<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n } from '$services';
	import { recoveryKeysPassphrase } from '$stores';
	import { BackArrow } from '$icons';
	import { IconButton } from '$components';

	import { PasswordForm } from '../components';
</script>

<div class="fixed top-0 left-0 right-0 app-region-drag flex items-center justify-between p-3 bg-[#DADADA12]">
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton buttonClass="absolute left-2" onClick={() => goto('advanced-setup-step-3')}><BackArrow /></IconButton>
		<span class="text-center text-semibold text-lg text-white">Advanced Setup (4 / 6)</span>
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
