<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$services';

	const client = trpc();

	const lairSetupRequired = client.launch.createMutation();

	let passwordInput = '';
	let confirmPasswordInput = '';
	let passwordsDontMatch = false;
	let setupProgress = '';

	const checkPasswords = () => {
		passwordsDontMatch = passwordInput !== confirmPasswordInput;
	};

	const setupAndLaunch = () => {
		$lairSetupRequired.mutate(
			{ password: passwordInput },
			{
				onSuccess: () => {
					goto('/app');
				}
			}
		);
	};

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			setupProgress = data;
		}
	});
</script>

<div class="column center-content">
	<h2>Setup Holochain Launcher</h2>
	<div class="max-w-500 text-center text-lg">
		Choose a password to encrypt your data and private keys. You will always need this password to
		start Launcher.
	</div>
	<h3>Select Password:</h3>
	<!-- svelte-ignore a11y-autofocus -->
	<input
		bind:value={passwordInput}
		autofocus
		on:input={checkPasswords}
		id="password-input"
		type="password"
		class="input"
	/>
	<h3>Confirm Password:</h3>
	<input
		bind:value={confirmPasswordInput}
		on:input={checkPasswords}
		id="confirm-password-input"
		type="password"
		class="input"
	/>
	<div class={passwordsDontMatch ? 'input-error' : 'color-transparent'}>Passwords don't match!</div>
	<button
		on:click={setupAndLaunch}
		tabindex="0"
		class="mb-8 mt-2"
		disabled={!passwordInput || passwordsDontMatch || $lairSetupRequired.isPending}
	>
		{$lairSetupRequired.isPending ? 'Loading...' : 'Setup and Launch'}
	</button>
	{#if setupProgress}
		<div class="setup-progress">
			{setupProgress}
		</div>
	{/if}
	{#if $lairSetupRequired.isError}
		<div class="input-error">
			{$lairSetupRequired.error.message}
		</div>
	{/if}
</div>
