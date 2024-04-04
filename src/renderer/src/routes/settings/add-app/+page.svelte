<script lang="ts">
	import { getModalStore, ProgressRadial } from '@skeletonlabs/skeleton';

	import { Button, IconInput, InputWithLabel } from '$components';
	import { showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { APP_STORE } from '$shared/types';
	import { isAppDataValid } from '$types';

	const client = trpc();
	const closeSettings = client.closeSettings.createMutation();

	const { publishHappMutation } = createAppQueries();

	const modalStore = getModalStore();

	let appData = {
		title: '',
		subtitle: '',
		description: '',
		version: '0.0.1',
		icon: undefined as Uint8Array | undefined,
		bytes: undefined as Uint8Array | undefined
	};
	const handleFileUpload =
		(key: 'icon' | 'bytes') =>
		async (file: File): Promise<void> => {
			const arrayBuffer = await file.arrayBuffer();
			appData = { ...appData, [key]: new Uint8Array(arrayBuffer) };
		};
</script>

<form
	class="modal-form mx-auto flex w-full max-w-xs flex-col space-y-4 pt-4"
	on:submit|preventDefault={async () => {
		if (isAppDataValid(appData)) {
			$publishHappMutation.mutate(appData, {
				onSuccess: () => {
					$closeSettings.mutate(APP_STORE);
				},
				onError: (error) => {
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
	<IconInput bind:icon={appData.icon} handleFileUpload={handleFileUpload('icon')} />
	<InputWithLabel bind:value={appData.title} id="happName" label={$i18n.t('nameYourHapp')} />
	<InputWithLabel
		bind:value={appData.subtitle}
		id="happDescription"
		label={$i18n.t('oneLineDescription')}
	/>
	<InputWithLabel
		bind:value={appData.description}
		id="description"
		label={$i18n.t('description')}
		maxLength={500}
	/>
	<InputWithLabel
		handleFileUpload={handleFileUpload('bytes')}
		id="webbhapp"
		label={$i18n.t('webbhapp')}
	/>
	<InputWithLabel
		bind:value={appData.version}
		id="version"
		label={$i18n.t('version')}
		maxLength={10}
	/>
	<footer class="modal-footer flex justify-between gap-2">
		<Button
			props={{
				disabled: $publishHappMutation.isPending || !isAppDataValid(appData),
				type: 'submit',
				class: 'btn bg-add-happ-button flex-1'
			}}
		>
			<span>{$i18n.t($publishHappMutation.isPending ? 'adding' : 'add')}</span>
			{#if $publishHappMutation.isPending}<ProgressRadial stroke={100} width="w-6" />{/if}
		</Button>
	</footer>
</form>
