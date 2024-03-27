<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	export let icon: Uint8Array;

	export let handleFileUpload: (file: File) => void;
	$: imageUrl = icon
		? URL.createObjectURL(new File([icon], 'defaultIcon.png', { type: 'image/png' }))
		: undefined;

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

<div class="flex justify-center">
	<Avatar src={imageUrl} initials="?" width="w-20" on:click={createInputAndTriggerClick} />
</div>
