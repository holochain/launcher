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
	let isPending = false;

	const handleIconUpload = async (file: File): Promise<void> => {
		const arrayBuffer = await file.arrayBuffer();
		appData = { ...appData, icon: new Uint8Array(arrayBuffer) };
	};

	const handleAppUpload = async (file: File): Promise<void> => {
		const arrayBuffer = await file.arrayBuffer();
		appData = { ...appData, bytes: new Uint8Array(arrayBuffer) };
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
	<InputWithLabel handleFileUpload={handleAppUpload} id="webbhapp" label={$i18n.t('webbhapp')} />
	<InputWithLabel
		bind:value={appData.version}
		id="version"
		label={$i18n.t('version')}
		maxLength={10}
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
