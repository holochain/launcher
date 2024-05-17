<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { Button, IconInput, InputWithLabel } from '$components';
	import { DEV_PAGE, EMPTY_APP_DATA } from '$const';
	import { convertFileToUint8Array, showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { isAppDataValid } from '$types';

	const { publishHappMutation } = createAppQueries();

	const modalStore = getModalStore();

	let appData = { ...EMPTY_APP_DATA };
	let bytesFiles: FileList | null = null;

	const setAppDataBytes = async (files: FileList | null) => {
		appData.bytes = files && files.length > 0 ? await convertFileToUint8Array(files[0]) : undefined;
	};

	const handleIconUpload = async (file: File): Promise<void> => {
		const icon = await convertFileToUint8Array(file);
		appData = { ...appData, icon };
	};

	$: setAppDataBytes(bytesFiles);
</script>

<form
	class="modal-form mx-auto my-4 flex w-full max-w-xs flex-col space-y-4"
	on:submit|preventDefault={async () => {
		if (isAppDataValid(appData)) {
			$publishHappMutation.mutate(appData, {
				onSuccess: (id) => {
					appData = { ...EMPTY_APP_DATA };
					bytesFiles = null;
					goto(`/${DEV_PAGE}/${id}`);
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
		label={$i18n.t('description')}
		maxLength={500}
	/>
	<InputWithLabel bind:files={bytesFiles} id="webbhapp" label={`${$i18n.t('webbhapp')}*`} />
	<InputWithLabel
		bind:value={appData.version}
		id="version"
		label={`${$i18n.t('version')}*`}
		maxLength={10}
	/>
	<footer class="modal-footer flex justify-between gap-2">
		<Button
			props={{
				disabled: $publishHappMutation.isPending || !isAppDataValid(appData),
				isLoading: $publishHappMutation.isPending,
				type: 'submit',
				class: 'btn bg-add-happ-button flex-1'
			}}
		>
			<span>{$i18n.t('add')}</span>
		</Button>
	</footer>
</form>
