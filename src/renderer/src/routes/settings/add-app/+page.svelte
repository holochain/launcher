<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	import { Button, IconInput, InputWithLabel } from '$components';
	// import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	// const { publishHappMutation } = createAppQueries();

	let publisherData = {
		name: '',
		location: { country: '', region: '', city: '' },
		website: { url: '', context: undefined },
		icon: undefined as Uint8Array | undefined
	};
	let isPending = false;

	const handleFileUpload = async (file: File): Promise<void> => {
		const arrayBuffer = await file.arrayBuffer();
		publisherData = { ...publisherData, icon: new Uint8Array(arrayBuffer) };
	};
</script>

<form
	class="modal-form mx-auto flex w-full max-w-xs flex-col space-y-4 pt-4"
	on:submit|preventDefault={() => {
		// $publishHappMutation.mutate();
	}}
>
	<IconInput bind:icon={publisherData.icon} {handleFileUpload} />
	<InputWithLabel bind:value={publisherData.name} id="happName" label={$i18n.t('nameYourHapp')} />
	<InputWithLabel
		bind:value={publisherData.location.country}
		id="happDescription"
		label={$i18n.t('oneLineDescription')}
	/>
	<InputWithLabel
		bind:value={publisherData.location.city}
		id="publisherCity"
		label={$i18n.t('description')}
		maxLength={500}
	/>
	<footer class="modal-footer flex justify-between gap-2">
		<Button
			props={{
				disabled: isPending,
				type: 'submit',
				class: 'btn bg-add-happ-button flex-1'
			}}
		>
			{#if isPending}
				<span>{$i18n.t('adding')}</span><ProgressRadial stroke={100} width="w-6" />
			{:else}
				<span>{$i18n.t('add')}</span>
			{/if}
		</Button>
	</footer>
</form>
