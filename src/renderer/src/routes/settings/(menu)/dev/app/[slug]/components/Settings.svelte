<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';

	import { Button, IconInput, InputWithLabel } from '$components';
	import { showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { type AppWithAction, isAppWithActionValid } from '$types';

	const { updateAppDetailsMutation, appStoreMyHappsQuery } = createAppQueries();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	export let app: AppWithAction;

	let appData = {
		title: app.title,
		subtitle: app.subtitle,
		description: app.description,
		icon: app.icon
	};

	const handleIconUpload = async (file: Uint8Array): Promise<void> => {
		appData = { ...appData, icon: file };
	};

	$: updatedAppData = { ...appData, action: app.action };
</script>

<form
	class="modal-form mx-auto my-4 flex w-full max-w-xs flex-col space-y-4"
	on:submit|preventDefault={async () => {
		if (isAppWithActionValid(updatedAppData)) {
			$updateAppDetailsMutation.mutate(updatedAppData, {
				onSuccess: () => {
					toastStore.trigger({
						message: $i18n.t('appDetailsUpdatedSuccessfully')
					});
					$appStoreMyHappsQuery.refetch();
				},
				onError: (error) => {
					console.error(error);
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
				disabled: $updateAppDetailsMutation.isPending || !isAppWithActionValid(updatedAppData),
				isLoading: $updateAppDetailsMutation.isPending,
				type: 'submit',
				class: 'btn-happ-button flex-1'
			}}
		>
			<span>{$i18n.t('updateAppDetails')}</span>
		</Button>
	</footer>
</form>
