<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Error, Input } from '$components';
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

<div class="p-40">
	<h3 class="header mb-4">{$i18n.t('enterPassword')}</h3>
	<Input
		bind:value={passwordInput}
		props={{
			id: 'password-input',
			type: 'password',
			placeholder: $i18n.t('passwordPlaceholder'),
			required: true
		}}
	/>
	<Button
		props={{
			disabled: !passwordInput || $launch.isPending,
			onClick: setupAndLaunch
		}}
	>
		{$i18n.t($launch.isPending ? 'loading' : 'launch')}
	</Button>
	{#if setupProgress}
		<div class="setup-progress mb-2">
			{$i18n.t(setupProgress)}
		</div>
	{/if}
	{#if $launch.isError}
		<Error text={$launch.error.message} />
	{/if}
</div>
