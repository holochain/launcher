<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { CreatePublisherFrontendInput } from 'appstore-tools';

	import { goto } from '$app/navigation';
	import { AddTypeModalFooter, IconInput } from '$components';
	import { ADD_APP_PAGE, DEV_PAGE } from '$const';
	import { base64ToArrayBuffer } from '$helpers';
	import { defaultIcon } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	import InputModal from './InputModal.svelte';

	const { publisherMutation } = createAppQueries();

	const modalStore = getModalStore();

	let publisherData: CreatePublisherFrontendInput = {
		name: '',
		location: { country: '', region: '', city: '' },
		website: { url: '', context: undefined },
		icon: base64ToArrayBuffer(defaultIcon)
	};

	const handleFileUpload = async (file: File): Promise<void> => {
		publisherData.icon = new Uint8Array(await file.arrayBuffer());
	};
</script>

{#if $modalStore[0]}
	<div
		class="card w-modal flex flex-col items-center justify-center !bg-transparent !ring-transparent"
	>
		<header class="pt-4 text-2xl font-bold">
			{$i18n.t('addPublisher')}
		</header>
		<form
			class="modal-form flex flex-col space-y-4 p-4"
			on:submit|preventDefault={() => {
				$publisherMutation.mutate(publisherData, {
					onSuccess: () => {
						modalStore.close();
						goto(`/${DEV_PAGE}/${ADD_APP_PAGE}`);
					}
				});
			}}
		>
			<IconInput bind:icon={publisherData.icon} {handleFileUpload} />
			<InputModal bind:value={publisherData.name} id="publisherName" label={$i18n.t('name')} />
			<InputModal
				bind:value={publisherData.location.country}
				id="publisherCountry"
				label={$i18n.t('country')}
			/>
			<InputModal
				bind:value={publisherData.location.region}
				id="publisherRegion"
				label={$i18n.t('region')}
			/>
			<InputModal
				bind:value={publisherData.location.city}
				id="publisherCity"
				label={$i18n.t('city')}
			/>
			<InputModal
				bind:value={publisherData.website.url}
				id="publisherWebsite"
				label={$i18n.t('website')}
			/>

			<AddTypeModalFooter
				isPending={$publisherMutation.isPending}
				isValid={publisherData.name.length > 0}
				onCancel={modalStore.close}
			/>
		</form>
	</div>
{/if}
