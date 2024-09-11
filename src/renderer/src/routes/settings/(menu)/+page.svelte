<script>
	import { i18n, trpc } from '$services';
	import PercentageBar from '../components/PercentageBar.svelte';

	const client = trpc();
	const defaultHolochainVersion = client.defaultHolochainVersion.createQuery();
</script>

<div class="relative flex flex-1 p-5">
	<div class="relative flex flex-1 flex-col items-center justify-center overflow-clip">
		<img src="/images/login-background.png" alt="Holochain Logo" class="absolute" style="min-width: 600px; top: 0;" />
		<div class="absolute flex flex-col items-center" style="top: 275px;">
			<span class="text-5xl font-bold">Holochain</span>
			<div class="text-xl text-slate-400">
				{#if $defaultHolochainVersion.data && $defaultHolochainVersion.data.type === 'built-in'}
					{$defaultHolochainVersion.data.version}
				{/if}
			</div>
		</div>
	</div>
	<div class="absolute bottom-8 flex flex-1 flex-col items-center px-4" style="width: calc(100% - 40px);">
		<div class="text-lg mb-1">??? MB Used</div>
		<div class="w-full">
			<PercentageBar height={20}></PercentageBar>
		</div>
	</div>
</div>
