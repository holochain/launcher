<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$components';
	import { ArrowLeft } from '$icons';
	import { i18n, trpc } from '$services';

	const goBack = () => window?.history.back();

	$: setupProgress = '';
	$: displayBackButton = $page.url.pathname.includes('confirm-password') && !setupProgress;

	const client = trpc();

	const handleSetupProgress = (data: string) => {
		setupProgress = data;
		if (data === 'settings') {
			goto('/settings');
		}
	};

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: handleSetupProgress
	});
</script>

<div class="bg-login-background relative flex h-screen flex-col bg-fixed bg-top bg-no-repeat">
	<div class="bg-tertiary-500 absolute inset-0 opacity-10" />
	<!-- White overlay div -->
	<p class="z-10 p-1 text-center text-xs opacity-30">Holochain Beta 0.1</p>
	{#if displayBackButton}
		<Button
			props={{
				class: 'btn-secondary z-10 self-start m-4',
				onClick: goBack
			}}
		>
			<ArrowLeft />
			{$i18n.t('back')}
		</Button>
	{/if}

	<div class="max-w-s z-10 flex flex-1 flex-col items-center justify-center text-center">
		<slot />
	</div>
</div>
