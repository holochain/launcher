<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Error, Input } from '$components';
	import { i18n, trpc } from '$services';

	const client = trpc();

	const setupAndLaunch = client.handleSetupAndLaunch.createMutation();

	let passwordInput = '';
	let confirmPasswordInput = '';
	let passwordsDontMatch = false;
	let setupProgress = '';

	const checkPasswords = () => {
		passwordsDontMatch = passwordInput !== confirmPasswordInput;
	};

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			setupProgress = data;
		}
	});
</script>

<div class="col center-content mx-auto max-w-xs space-y-2 text-center">
	<h2 class="header mb-2">{$i18n.t('setupHolochainLauncher')}</h2>
	<div class="max-w-500 mb-2 text-center text-lg">
		{$i18n.t('choosePassword')}
	</div>
	<h3 class="header mb-2">{$i18n.t('selectPassword')}:</h3>
	<Input
		on:input={checkPasswords}
		bind:value={passwordInput}
		props={{
			id: 'password-input',
			type: 'password',
			placeholder: $i18n.t('passwordPlaceholder'),
			required: true
		}}
	/>
	<h3 class="header mb-2">{$i18n.t('confirmPassword')}:</h3>
	<Input
		bind:value={confirmPasswordInput}
		on:input={checkPasswords}
		props={{
			id: 'confirm-password-input',
			type: 'password',
			placeholder: $i18n.t('confirmPasswordPlaceholder'),
			required: true
		}}
	/>
	<div class={passwordsDontMatch ? 'input-error mb-2' : 'color-transparent'}>
		{$i18n.t('passwordsDontMatch')}
	</div>
	<Button
		props={{
			disabled: !passwordInput || passwordsDontMatch || $setupAndLaunch.isPending,
			onClick: () =>
				$setupAndLaunch.mutate(
					{ password: passwordInput },
					{
						onSuccess: () => {
							goto('/app');
						}
					}
				)
		}}
	>
		{$i18n.t($setupAndLaunch.isPending ? 'loading' : 'launch')}
	</Button>
	{#if setupProgress}
		<div class="setup-progress mb-2">
			{$i18n.t(setupProgress)}
		</div>
	{/if}
	{#if $setupAndLaunch.isError}
		<Error text={$setupAndLaunch.error.message} />
	{/if}
</div>
