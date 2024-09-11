<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { CreatePublisherFrontendInput } from 'appstore-tools';

	import { goto } from '$app/navigation';
	import { Button, IconInput, InputWithLabel } from '$components';
	import { DEV_PAGE } from '$const';
	import { base64ToArrayBuffer, showModalError } from '$helpers';
	import { defaultIcon } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const modalStore = getModalStore();

	const { publisherMutation } = createAppQueries();

	let publisherData: CreatePublisherFrontendInput = {
		name: '',
		location: '',
		website: { url: '', context: undefined },
		icon: base64ToArrayBuffer(defaultIcon)
	};

	const handleFileUpload = async (file: Uint8Array): Promise<void> => {
		publisherData.icon = file;
	};
</script>

<div class="flex flex-1 flex-col items-center justify-center">
	<header class="pt-4 text-2xl font-bold">
		{$i18n.t('setUpYourPublisherProfile')}
	</header>
	<form
		class="modal-form flex flex-col space-y-4 p-4"
		on:submit|preventDefault={() => {
			$publisherMutation.mutate(publisherData, {
				onSuccess: () => {
					goto(`/${DEV_PAGE}`);
				},
				onError: (error) => {
					modalStore.close();
					console.error(error);
					showModalError({
						modalStore,
						errorTitle: $i18n.t('appError'),
						errorMessage: $i18n.t(error.message)
					});
				}
			});
		}}
	>
		<IconInput bind:icon={publisherData.icon} {handleFileUpload} />
		<InputWithLabel bind:value={publisherData.name} id="publisherName" label={$i18n.t('name')} />
		<InputWithLabel
			bind:value={publisherData.location}
			id="publisherLocation"
			label={$i18n.t('location')}
		/>
		<InputWithLabel
			bind:value={publisherData.website.url}
			id="publisherWebsite"
			label={$i18n.t('website')}
		/>

		<footer class="flex justify-between gap-2">
			<Button
				props={{
					disabled: $publisherMutation.isPending || publisherData.name.length === 0,
					isLoading: $publisherMutation.isPending,
					type: 'submit',
					class: 'btn-happ-button flex-1'
				}}
			>
				<span>{$i18n.t('add')}</span>
			</Button>
		</footer>
	</form>
</div>
