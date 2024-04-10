<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$components';
	import { ArrowLeft } from '$icons';
	import { i18n, trpc } from '$services';

	const goBack = () => window?.history.back();

	$: setupProgress = '';
	$: displayBackButton = $page.url.pathname.includes('confirm-password') && !setupProgress;

	const client = trpc();

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data: string) => {
			setupProgress = data;
		}
	});
</script>

<div class="relative flex h-screen flex-col bg-login-background bg-fixed bg-center bg-no-repeat">
	<div class="absolute inset-0 bg-tertiary-500 opacity-10" />
	<p class="app-region-drag z-10 p-1 text-center text-xs opacity-30">Holochain Beta 0.1</p>
	{#if displayBackButton}
		<Button
			props={{
				class: 'btn-secondary z-10 self-start m-4 font-semibold',
				onClick: goBack
			}}
		>
			<ArrowLeft />
			{$i18n.t('back')}
		</Button>
	{/if}

	<div class="max-w-s z-10 mb-8 flex flex-1 flex-col items-center justify-center text-center">
		<slot />
	</div>
</div>
