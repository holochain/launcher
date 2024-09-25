<script lang="ts">
	import { Avatar, popup } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { createImageUrl } from '$helpers';
	import { AppWarning, Verified } from '$icons';
	import { i18n } from '$services';
	import { APP_STORE } from '$shared/const';

	export let icon: Uint8Array | undefined = undefined;
	export let id: string;
	export let verified: boolean | undefined = undefined;
	export let title: string = $i18n.t('kando');
	export let subtitle: string = '';

	$: imageUrl = createImageUrl(icon);
</script>

<button
	on:click={() => goto(`/${APP_STORE}/${id}`)}
	class="card flex cursor-pointer items-center p-4 dark:variant-soft-tertiary dark:hover:bg-tertiary-900"
>
	<div class="min-w-16">
		<Avatar
			src={imageUrl}
			initials={'kn'}
			rounded="rounded-2xl"
			background="dark:bg-app-gradient"
		/>
	</div>
	<div class="ml-4 mr-2 flex flex-col items-start">
		<div class="flex flex-row items-center gap-2">
			<h3 class="h3">{title}</h3>
			{#if verified === true}
				<div class="flex flex-row gap-1">
					<Verified />
					<span class="text-xs font-light text-success-500">{$i18n.t('verified')}</span>
				</div>
			{:else if verified === false}
				<button
					type="button"
					class="!outline-none [&>*]:pointer-events-none"
					use:popup={{
						event: 'hover',
						target: 'popupHover',
						placement: 'bottom'
					}}
				>
					<AppWarning />
				</button>
				<div class="card z-50 max-w-xs !bg-warning-600 p-4 text-black" data-popup="popupHover">
					<span class="whitespace-normal"
						>{$i18n.t('thisAppHasNotBeenVerifiedByTheHolochainFoundation')}</span
					>
					<div class="arrow bg-warning-600" />
				</div>
			{/if}
		</div>
		<p class="line-clamp-2 text-left text-xs leading-[0.8rem] opacity-60">{subtitle}</p>
	</div>
</button>
