<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$services';

	let passwordInput = '';
	let setupProgress = '';

	const client = trpc();

	const lairSetupRequired = client.launch.createMutation();

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
	<h3 class="header">Enter Password:</h3>
	<!-- svelte-ignore a11y-autofocus -->
	<input autofocus bind:value={passwordInput} id="password-input" type="password" class="input" />
	<button
		on:click={setupAndLaunch}
		tabindex="0"
		class="button"
		disabled={!passwordInput || $lairSetupRequired.isPending}
	>
		{$lairSetupRequired.isPending ? 'Loading...' : 'Launch'}
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
