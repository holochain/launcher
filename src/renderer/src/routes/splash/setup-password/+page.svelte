<script lang="ts">
	import { goto } from '$app/navigation';
	import { TitleSubtitle } from '$components';
	import PasswordForm from '$components/PasswordForm.svelte';
	import { i18n } from '$services';
	import { appPassword } from '$stores';
</script>

<p class="text-base font-semibold leading-[0.5] opacity-50">1 {$i18n.t('of')} 2</p>
<TitleSubtitle
	title={$i18n.t('secureYourAccount')}
	subtitle={$i18n.t('chooseCarefullyPasswordsCanNotBeRecovered')}
/>
<PasswordForm
	bind:value={$appPassword}
	placeholderText={$i18n.t('chooseAPassword')}
	buttonAction={() => goto('confirm-password')}
	isDisabled={$appPassword.length < 1}
/>
<p class="text-xs font-semibold leading-[0.5] opacity-50">
	{$i18n.t('password').toUpperCase()}
</p>
