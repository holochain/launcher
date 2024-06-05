<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button, IconInput, InputWithLabel } from '$components';
	import { DEV_APP_PAGE } from '$const';
	import { showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { type AppWithIcon, isUpdateAppDataValid } from '$types';
	import { encodeHashToBase64 } from '@holochain/client';

	const { updateAppDetailsMutation } = createAppQueries();

	const modalStore = getModalStore();

	export let app: AppWithIcon;

	let appData = { ...app };

	let isLoading = false;

	const handleIconUpload = async (file: Uint8Array): Promise<void> => {
		appData = { ...appData, icon: file };
	};
</script>

<form
	class="modal-form mx-auto my-4 flex w-full max-w-xs flex-col space-y-4"
	on:submit|preventDefault={async () => {
		if (isUpdateAppDataValid(appData)) {
			isLoading = true;
			$updateAppDetailsMutation.mutate(appData, {
				onSuccess: (id) => {
					isLoading = false;
					goto(`/${DEV_APP_PAGE}/${id}`);
				},
				onError: (error) => {
					console.error(error);
					isLoading = false;
					showModalError({
						modalStore,
						errorTitle: $i18n.t('appError'),
						errorMessage: $i18n.t(error.message)
					});
				}
			});
		}
	}}
>
	<IconInput bind:icon={appData.icon} handleFileUpload={handleIconUpload} />
	<InputWithLabel bind:value={appData.title} id="happName" label={`${$i18n.t('nameYourHapp')}*`} />
	<InputWithLabel
		bind:value={appData.subtitle}
		id="happDescription"
		label={`${$i18n.t('oneLineDescription')}*`}
	/>
	<InputWithLabel
		bind:value={appData.description}
		id="description"
		largeTextField
		label={$i18n.t('description')}
		maxLength={500}
	/>
	<footer class="modal-footer flex justify-between gap-2">
		<Button
			props={{
				disabled: $updateAppDetailsMutation.isPending || !isUpdateAppDataValid(appData),
				isLoading: isLoading || $updateAppDetailsMutation.isPending,
				type: 'submit',
				class: 'btn-happ-button flex-1'
			}}
		>
			<span>{$i18n.t('updateAppDetails')}</span>
		</Button>
	</footer>
</form>
