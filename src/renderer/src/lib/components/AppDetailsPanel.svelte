<script lang="ts">
	import { encodeHashToBase64 } from '@holochain/client';
	import { Avatar } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';

	import { Button } from '$components';

	export let imageUrl: string | undefined = undefined;
	export let title: string;
	export let id: Uint8Array | undefined = undefined;
	export let subtitle = '';
	export let appVersion = '';
	export let selectedIndex = 0;
	export let buttons: Array<string>;
</script>

<div class="bg-app-details-gradient p-8 pb-4">
	<div class="flex justify-between">
		<div class="flex items-center space-x-4 pb-4">
			<Avatar
				width="w-20"
				src={imageUrl}
				initials={title}
				fill="fill-current text-white"
				background="dark:bg-app-gradient"
				rounded="rounded-sm"
			/>
			<div class="flex flex-col">
				<div class="flex items-end">
					{#if id}
						<button
							type="button"
							class="h3"
							on:click={() => navigator.clipboard.writeText(encodeHashToBase64(id))}
						>
							{title}
						</button>
					{:else}
						<h3 class="h3">{title}</h3>
					{/if}
					{#if appVersion}
						<p class="ml-2 text-xs">{appVersion}</p>
					{/if}
				</div>
				{#if subtitle}
					<p class="text-xs text-white/80">{subtitle}</p>
				{/if}
			</div>
		</div>
		<slot name="topRight" />
	</div>
	{#if buttons.length > 1}
		{#each buttons as button, index}
			<Button
				props={{
					type: 'button',
					onClick: () => {
						selectedIndex = index;
					},
					class: clsx(
						'rounded-sm px-3 py-2 border-white/25 border mr-2 d',
						index === selectedIndex ? 'bg-white/25 font-semibold' : 'bg-transparent text-white/80'
					)
				}}
			>
				{button}
			</Button>
		{/each}
	{/if}
</div>
