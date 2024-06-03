<script lang="ts">
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';

	import { createImageUrl } from '$helpers';

	import ModalInstallForm from './ModalInstallForm.svelte';

	const modalStore = getModalStore();

	export let appName: string;
	export let icon: Uint8Array | undefined;

	let formData = {
		appId: '',
		networkSeed: ''
	};

	$: imageUrl = createImageUrl(icon);
</script>

<ModalInstallForm
	name={appName}
	bind:formData
	onSubmit={() => {
		$modalStore[0]?.response?.(formData);
	}}
>
	<div slot="avatar">
		{#if imageUrl}
			<Avatar src={imageUrl} rounded="rounded-2xl" background="dark:bg-app-gradient" width="w-20" />
		{/if}
	</div>
</ModalInstallForm>
