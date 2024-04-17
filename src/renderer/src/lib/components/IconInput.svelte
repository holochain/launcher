<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { createImageUrl } from '$helpers';
	import { UploadImage } from '$icons';
	import { i18n } from '$services';

	export let icon: Uint8Array | undefined = undefined;

	export let handleFileUpload: (file: File) => void;
	$: imageUrl = createImageUrl(icon);

	const createInputAndTriggerClick = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/png';
		input.onchange = (event: Event) => {
			const input = event.target as HTMLInputElement;
			const file = input.files?.[0];
			if (file) handleFileUpload(file);
		};
		input.click();
	};
</script>

<button
	type="button"
	class="mx-auto flex-shrink !outline-none"
	on:click={createInputAndTriggerClick}
	aria-label="Upload Image"
>
	{#if !imageUrl}
		<div
			class="relative flex flex-shrink flex-col items-center rounded-lg border-2 border-dashed border-surface-400 bg-surface-700 p-6"
			role="img"
			aria-label="Uploaded Image Preview"
		>
			<span class="absolute top-1 text-xs opacity-50">{$i18n.t('icon').toUpperCase()}</span>
			<UploadImage />
		</div>
	{:else}
		<Avatar src={imageUrl} width="w-20" />
	{/if}
</button>
