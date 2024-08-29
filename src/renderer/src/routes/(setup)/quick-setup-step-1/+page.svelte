<script lang="ts">
	import { goto } from '$app/navigation';
	import { IconButton } from '$components';
	import { BackArrow } from '$icons';
	import { i18n } from '$services';
	import { appPassword } from '$stores';

	import { PasswordForm } from '../components';
</script>

<div class="fixed top-0 left-0 right-0 app-region-drag flex items-center justify-between p-3 bg-[#DADADA12]">
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton buttonClass="absolute left-2" onClick={() => { $appPassword = ''; goto('welcome') }}><BackArrow /></IconButton>
		<span class="text-center text-semibold text-lg text-white">Quick Setup (1 / 2)</span>
	</div>
</div>

<h2 class="h2 mb-4">{$i18n.t('setLauncherPassword')}</h2>
<p class="text-base">{$i18n.t('This password will be used to encrypt your data and private keys')}</p>
<p class="text-base mb-10">{$i18n.t('You will need to enter it everytime you start up Holochain Launcher')}</p>

<PasswordForm
	bind:value={$appPassword}
	placeholderText={$i18n.t('chooseAPassword')}
	buttonAction={() => goto('quick-setup-step-2')}
	isDisabled={$appPassword.length < 1}
/>
<p class="text-xs font-semibold leading-[0.5] opacity-50">
	{$i18n.t('password').toUpperCase()}
</p>
