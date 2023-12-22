<script lang="ts">
	import { goto } from '$app/navigation';
	import { Error } from '$components';
	import { i18n, trpc } from '$services';

	let passwordInput = '';
	let setupProgress = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const setupAndLaunch = () => {
		$launch.mutate(
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

<div class="col center-content mx-auto max-w-xs space-y-2 text-center">
	<h3 class="header mb-2">{$i18n.t('enterPassword')}</h3>
	<!-- svelte-ignore a11y-autofocus -->
	<input autofocus bind:value={passwordInput} id="password-input" type="password" class="input" />
	<button
		on:click={setupAndLaunch}
		tabindex="0"
		class="btn variant-filled mx-2"
		disabled={!passwordInput || $launch.isPending}
	>
		{$i18n.t($launch.isPending ? 'loading' : 'launch')}
	</button>
	{#if setupProgress}
		<div class="setup-progress mb-2">
			{$i18n.t(setupProgress)}
		</div>
	{/if}
	{#if $launch.isError}
		<Error text={$launch.error.message} />
	{/if}
</div>
