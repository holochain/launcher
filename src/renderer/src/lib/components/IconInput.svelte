<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { createImageUrl, resizeImage } from '$helpers';
	import { UploadImage } from '$icons';
	import { i18n } from '$services';
	export let icon: Uint8Array | undefined = undefined;

	export let handleFileUpload: (icon: Uint8Array) => void;

	let imageUrl: string | undefined;

	$: imageUrl = createImageUrl(icon);

	const createInputAndTriggerClick = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/png';
		input.onchange = async (event: Event) => {
			const input = event.target as HTMLInputElement;
			const file = input.files?.[0];
			if (file) {
				const resizedFile = await resizeImage(file);
				if (resizedFile) {
					handleFileUpload(resizedFile);
					imageUrl = createImageUrl(resizedFile);
				}
			}
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
			class="relative flex flex-shrink w-36 h-36 flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-400 bg-surface-700 p-6"
			role="img"
			aria-label="Uploaded Image Preview"
		>
			<span class="absolute top-7 text-xs opacity-50">{`${$i18n.t('icon').toUpperCase()}*`}</span>
			<UploadImage />
		</div>
	{:else}
	<span>{imageUrl}</span>
		<Avatar src={imageUrl} width="w-36" />
	{/if}
</button>
