<script lang="ts">
	import { goto } from '$app/navigation';
	import { Error } from '$components';
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

<div class="column center-content">
	<h2>{$i18n.t('setupHolochainLauncher')}</h2>
	<div class="max-w-500 text-center text-lg">
		{$i18n.t('choosePassword')}
	</div>
	<h3>{$i18n.t('selectPassword')}:</h3>
	<!-- svelte-ignore a11y-autofocus -->
	<input
		bind:value={passwordInput}
		autofocus
		on:input={checkPasswords}
		id="password-input"
		type="password"
		class="input"
	/>
	<h3>{$i18n.t('confirmPassword')}:</h3>
	<input
		bind:value={confirmPasswordInput}
		on:input={checkPasswords}
		id="confirm-password-input"
		type="password"
		class="input"
	/>
	<div class={passwordsDontMatch ? 'input-error' : 'color-transparent'}>
		{$i18n.t('passwordsDontMatch')}
	</div>
	<button
		on:click={() =>
			$setupAndLaunch.mutate(
				{ password: passwordInput },
				{
					onSuccess: () => {
						goto('/app');
					}
				}
			)}
		tabindex="0"
		class="mb-8 mt-2"
		disabled={!passwordInput || passwordsDontMatch || $setupAndLaunch.isPending}
	>
		{$i18n.t($setupAndLaunch.isPending ? 'loading' : 'launch')}
	</button>
	{#if setupProgress}
		<div class="setup-progress">
			{$i18n.t(setupProgress)}
		</div>
	{/if}
	{#if $setupAndLaunch.isError}
		<Error text={$setupAndLaunch.error.message} />
	{/if}
</div>
