<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import type { AppEntry, Entity } from 'appstore-tools';
	import type { UpdateAppFrontendInput } from 'appstore-tools/dist/appstore/types.js';

	import { Button, IconInput, InputWithLabel } from '$components';
	import { showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { updateAppDetailsMutation, appStoreMyAppsQuery } = createAppQueries();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	export let app: Entity<AppEntry>;

	let appData: UpdateAppFrontendInput = {
		title: app.content.title,
		subtitle: app.content.subtitle,
		description: app.content.description,
		icon: app.content.icon
	};

	const handleIconUpload = async (file: Uint8Array): Promise<void> => {
		appData = { ...appData, icon: file };
	};

	$: updatedAppData = { properties: { ...appData }, base: app.action };
</script>

<div class="flex flex-col items-center px-8 py-6">
	<div class="mb-5 max-w-[420px] text-center text-base font-semibold text-white/70">
		{$i18n.t('updateAppDetailsExplanation')}
	</div>

	<form
		class="modal-form mx-auto my-4 mb-16 flex w-full max-w-xs flex-col space-y-4"
		on:submit|preventDefault={async () => {
			$updateAppDetailsMutation.mutate(updatedAppData, {
				onSuccess: () => {
					toastStore.trigger({
						message: $i18n.t('appDetailsUpdatedSuccessfully')
					});
					$appStoreMyAppsQuery.refetch();
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
		}}
	>
		<IconInput bind:icon={appData.icon} handleFileUpload={handleIconUpload} />
		<InputWithLabel
			bind:value={appData.title}
			id="happName"
			label={`${$i18n.t('nameYourHapp')}*`}
		/>
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
		<footer class="flex justify-between gap-2">
			<Button
				props={{
					disabled: $updateAppDetailsMutation.isPending,
					isLoading: $updateAppDetailsMutation.isPending,
					type: 'submit',
					class: 'btn-happ-button flex-1'
				}}
			>
				<span>{$i18n.t('updateAppDetails')}</span>
			</Button>
		</footer>
	</form>
</div>
