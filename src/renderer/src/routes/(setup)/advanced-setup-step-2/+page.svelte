<script lang="ts">
	import { getToastStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { IconButton } from '$components';
	import { BackArrow, Warning } from '$icons';
	import { i18n } from '$services';
	import { appPassword } from '$stores';

	import { PasswordForm } from '../components';

	const toastStore = getToastStore();

	let confirmPasswordInput = '';
</script>

<div
	class="app-region-drag fixed left-0 right-0 top-0 flex items-center justify-between bg-[#DADADA12] p-3"
>
	<div class="relative flex w-full items-center justify-center py-[11px]">
		<IconButton
			buttonClass="absolute left-2"
			onClick={() => {
				$appPassword = '';
				goto('advanced-setup-step-1');
			}}><BackArrow /></IconButton
		>
		<span class="text-semibold text-center text-lg text-white">Advanced Setup (2 / 6)</span>
	</div>
</div>

<h1 class="h1 mb-8">1. {$i18n.t('setLauncherPassword')}</h1>
<h2 class="h2">{$i18n.t('confirmYourPassword')}</h2>
<div class="pb-2">
	<Warning />
</div>
<p class="mb-4 max-w-72 font-[450] leading-tight text-warning-500">
	{$i18n.t('passwordWarning')}
</p>
<PasswordForm
	placeholderText={$i18n.t('confirmPassword')}
	buttonAction={() => {
		if ($appPassword !== confirmPasswordInput) {
			toastStore.trigger({
				message: $i18n.t('passwordsDontMatch'),
				background: 'variant-filled-error'
			});
			return;
		}
		goto('advanced-setup-step-3');
	}}
	bind:value={confirmPasswordInput}
	isDisabled={!confirmPasswordInput}
/>
<p class="pb-10 text-xs font-semibold leading-[0.5] opacity-50">
	{$i18n.t('password').toUpperCase()}
</p>
