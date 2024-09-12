<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	// @ts-expect-error the @spartan-hc/bundles package has no typescript types
	import { Bundle } from '@spartan-hc/bundles';

	import { goto } from '$app/navigation';
	import { Button, CenterProgressRadial, IconInput, InputWithLabel } from '$components';
	import { DEV_APP_PAGE, EMPTY_APP_DATA } from '$const';
	import { convertFileToUint8Array, showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { isAppDataValid } from '$types';
	import DashedSection from '../../components/DashedSection.svelte';
	import { Info } from '$icons';

	const { publishHappMutation, publishersQuery } = createAppQueries();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const client = trpc();

	const validateWebhappFormat = client.validateWebhappFormat.createMutation();

	let appData = { ...EMPTY_APP_DATA };
	let bytesFiles: FileList | null = null;

	$: isLoading = false;

	const setAppDataBytes = async (files: FileList | null) => {
		if (files && files.length > 0) {
			try {
				const bytes = await convertFileToUint8Array(files[0]);

				const bundle = new Bundle(bytes);
				appData.bytes = bytes;
				appData.title = appData.title || bundle?.name || '';
			} catch (e) {
				bytesFiles = null;
				toastStore.trigger({
					message: `The uploaded file is not of a valid .webhapp format: ${e}`,
					background: 'variant-filled-error'
				});
			}
		}
	};

	const handleIconUpload = async (file: Uint8Array): Promise<void> => {
		appData = { ...appData, icon: file };
	};

	$: setAppDataBytes(bytesFiles);

	const submitForm = async () => {
		isLoading = true;
		setTimeout(async () => {
			if (isAppDataValid(appData)) {
				$validateWebhappFormat.mutate(appData.bytes, {
					onSuccess: () => {
						if (isAppDataValid(appData)) {
							$publishHappMutation.mutate(appData, {
								onSuccess: (id) => {
									appData = { ...EMPTY_APP_DATA };
									bytesFiles = null;
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
					},
					onError: (error) => {
						console.error(error);
						isLoading = false;
						showModalError({
							modalStore,
							errorTitle: $i18n.t('appError'),
							errorMessage: `The uploaded file is not of a valid .webhapp format: ${error}`
						});
					}
				});
			} else {
				isLoading = false;
			}
		}, 100); // 100ms delay to display loading before spinner freezes
	};
</script>

{#if $publishersQuery.isPending}
	<div class="flex flex-1 flex-col items-center justify-center">
		<CenterProgressRadial width="w-12" />
	</div>
{:else if $publishersQuery.isError}
	<div class="flex flex-1 flex-col items-center justify-center">
		Failed to fetch publisher profile.
	</div>
{:else}
	<div class="flex flex-1 flex-col items-center justify-center">
		<header class="mb-2 mt-6 pt-4 text-2xl font-bold">
			{$i18n.t('publishNewApp')}
		</header>
		<div class="mb-5 text-base font-semibold text-white/70 max-w-[420px] text-center">
			{$i18n.t('When your app is published, it will become available to all users of the launcher in the list of unverified apps.')}
		</div>
		<form
			class="modal-form mx-auto my-4 flex w-full max-w-xs flex-col space-y-4 mb-16"
			on:submit|preventDefault={submitForm}
		>
			<IconInput bind:icon={appData.icon} handleFileUpload={handleIconUpload} />
			<InputWithLabel
				bind:files={bytesFiles}
				id="webhapp"
				label={`${$i18n.t('uploadYourBundle')}*`}
			/>
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
				label={`${$i18n.t('description')}*`}
				maxLength={500}
			/>
			<InputWithLabel
				bind:value={appData.version}
				id="version"
				label={`${$i18n.t('version')}*`}
				maxLength={50}
			/>
			<DashedSection borderColor="text-amber-300 border-amber-300">
				<div class="flex flex-row">
					<span class="text-amber-300 py-1 mr-2"><Info size={26} fillColor="#fcd34d" /></span>
					<span>{$i18n.t('keepLauncherRunningAfterPublish')}</span>
				</div>
			</DashedSection>
			<footer class="flex justify-between gap-2">
				<Button
					props={{
						disabled: $publishHappMutation.isPending || !isAppDataValid(appData),
						isLoading: isLoading || $publishHappMutation.isPending,
						type: 'submit',
						class: 'btn-happ-button flex-1'
					}}
				>
					<span>{$i18n.t('publishYourApp')}</span>
				</Button>
			</footer>
		</form>
	</div>
{/if}
