<script lang="ts">
	import { Splash } from '$lib/components';
	import { trpc } from '$services';

	const client = trpc();
	const defaultHolochainVersion = client.declaredHolochainVersion.createQuery();
</script>

<div class="relative flex h-screen flex-col bg-fixed bg-center bg-no-repeat">
	<div class="absolute inset-0 z-0">
		<Splash />
	</div>
	<div class="absolute inset-0 bg-tertiary-500 opacity-5" />
	{#if $defaultHolochainVersion.isSuccess}
		<p class="app-region-drag z-10 p-1 text-center text-xs opacity-30">
			Holochain {$defaultHolochainVersion.data}
		</p>
	{/if}
	<div
		class="max-w-s relative z-10 mb-8 flex flex-1 flex-col items-center justify-center text-center"
	>
		<slot />
	</div>
</div>
