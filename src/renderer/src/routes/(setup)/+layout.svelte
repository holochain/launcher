<script lang="ts">
	import { fly } from 'svelte/transition';

	import { trpc } from '$services';
	import { ANIMATION_DURATION } from '$shared/const';

	const client = trpc();
	const launcherVerion = client.getLauncherVersion.createQuery();
</script>

<div class="relative flex h-screen flex-col bg-login-background bg-fixed bg-center bg-no-repeat">
	<div class="absolute inset-0 bg-tertiary-500 opacity-15" />
	<div
		class="max-w-s relative z-10 mb-8 flex flex-1 flex-col items-center justify-center text-center"
		in:fly={{ x: -200, duration: ANIMATION_DURATION, delay: ANIMATION_DURATION }}
	>
		<slot />
	</div>
	{#if $launcherVerion.isSuccess}
		<p class="absolute bottom-0 left-0 p-1 text-xs opacity-30">
			{$launcherVerion.data}
		</p>
	{/if}
</div>
