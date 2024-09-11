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
	export let publisher: string | undefined;
</script>

<div class="bg-app-details-gradient p-8 pb-4">
	<div class="flex justify-between">
		<div class="flex items-center space-x-4 pb-4 mb-3">
			<Avatar
				width="w-24"
				src={imageUrl}
				initials={title}
				fill="fill-current text-white"
				background="dark:bg-app-gradient"
				rounded="rounded-lg"
			/>
			<div class="flex flex-col">
				<div class="flex items-end">
					{#if id}
						<button
							type="button"
							class="h3"
							on:click={() => navigator.clipboard.writeText(encodeHashToBase64(id))}
						>
							<h3 class="text-2xl font-semibold">{title}</h3>
						</button>
					{:else}
						<h3 class="text-2xl font-semibold">{title}</h3>
					{/if}
					{#if appVersion}
						<p class="ml-2 text-sm font-semibold opacity-50 mb-0.5">{appVersion}</p>
					{/if}
				</div>
				{#if subtitle}
					<p class="text-base font-bold text-white/60">{subtitle}</p>
				{/if}
				{#if publisher}
					<p class="text-sm text-white">By <span class="font-bold underline">{publisher}</span></p>
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
