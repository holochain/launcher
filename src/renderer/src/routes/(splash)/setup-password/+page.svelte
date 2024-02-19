<script lang="ts">
	import { goto } from '$app/navigation';
	import { i18n } from '$services';
	import { appPassword } from '$stores';

	import { PasswordForm } from '../components';
</script>

<p class="text-base font-semibold leading-[0.5] opacity-50">1 {$i18n.t('of')} 2</p>
<h2 class="h2 mb-4">{$i18n.t('setYourPassword')}</h2>
<PasswordForm
	bind:value={$appPassword}
	placeholderText={$i18n.t('chooseAPassword')}
	buttonAction={() => goto('confirm-password')}
	isDisabled={$appPassword.length < 1}
/>
<p class="text-xs font-semibold leading-[0.5] opacity-50">
	{$i18n.t('password').toUpperCase()}
</p>
