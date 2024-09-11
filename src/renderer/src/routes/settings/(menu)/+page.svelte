<script>
	import { divideObject, recursiveSum } from '$helpers';
	import { trpc } from '$services';
	import PercentageBar from '../components/PercentageBar.svelte';

	const client = trpc();
	const defaultHolochainVersion = client.defaultHolochainVersion.createQuery();
	const storageInfoQuery = client.getHolochainStorageInfo.createQuery();
	let fractions;
	const labels = [
		'UIs',
		'happs',
		'wasm-cache',
		'conductor',
		'authored',
		'p2p',
		'cache',
		'dht',
		'wasm'
	];
</script>

<div class="relative flex flex-1 p-5">
	<div class="relative flex flex-1 flex-col items-center justify-center overflow-clip">
		<img
			src="/images/login-background.png"
			alt="Holochain Logo"
			class="absolute"
			style="min-width: 600px; top: 0;"
		/>
		<div class="absolute flex flex-col items-center" style="top: 275px;">
			<span class="text-5xl font-bold">Holochain</span>
			<div class="text-xl text-slate-400">
				{#if $defaultHolochainVersion.data && $defaultHolochainVersion.data.type === 'built-in'}
					{$defaultHolochainVersion.data.version}
				{/if}
			</div>
		</div>
	</div>
	{#if $storageInfoQuery.data}
		{@const storageInfoMB = divideObject($storageInfoQuery.data, 1e6)}
		{@const totalStorage = recursiveSum(storageInfoMB)}
		<div
			class="absolute bottom-8 flex flex-1 flex-col items-center px-4"
			style="width: calc(100% - 40px);"
		>
			<div class="mb-1 text-lg">{Math.round(totalStorage)} MB Used</div>
			<div class="w-full">
				<PercentageBar values={storageInfoMB} height={20} unit="MB"></PercentageBar>
			</div>
		</div>
	{/if}
</div>
