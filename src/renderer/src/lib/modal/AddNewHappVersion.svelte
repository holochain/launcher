<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { AddTypeModalFooter, InputWithLabel } from '$components';
	import { convertFileToUint8Array, showModalError } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { isPublishNewVersionDataValid } from '$types';

	const { publishNewVersionMutation } = createAppQueries();

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const client = trpc();

	const validateWebhappFormat = client.validateWebhappFormat.createMutation();

	export let webappPackageId: Uint8Array;
	export let appEntryId: Uint8Array;
	export let previousVersions: Entity<AppVersionEntry>[];

	let files: FileList | null = null;
	let version = '';
	let bytes: Uint8Array | undefined;

	const previousHappHash = previousVersions
		.map((entity) => entity.content)
		.sort((a, b) => a.last_updated - b.last_updated)[0].bundle_hashes.happ_hash;

	const setAppDataBytes = async (files: FileList | null) => {
		if (files && files.length > 0) {
			bytes = await convertFileToUint8Array(files[0]);
		}
	};

	$: isLoading = false;

	$: setAppDataBytes(files);
</script>

{#if $modalStore[0]}
	<div
		class="card w-modal flex flex-col items-center justify-center !bg-modal-background p-2 !ring-transparent"
	>
		<header class="pt-4 text-2xl font-bold">
			{$i18n.t('addNewRelease')}
		</header>
		<form
			class="modal-form flex flex-col space-y-4 p-4"
			on:submit|preventDefault={() => {
				const publishNewVersionData = {
					webappPackageId,
					version,
					bytes,
					appEntryId,
					previousHappHash
				};
				if (isPublishNewVersionDataValid(publishNewVersionData)) {
					isLoading = true;
					$validateWebhappFormat.mutate(publishNewVersionData.bytes, {
						onSuccess: () => {
							$publishNewVersionMutation.mutate(publishNewVersionData, {
								onSuccess: () => {
									modalStore.close();
								},
								onError: (error) => {
									console.error(error);
									isLoading = false;
									toastStore.trigger({
										message: `Failed to upload new release: ${error.message}`,
										background: 'variant-filled-error'
									});
								}
							});
						},
						onError: (error) => {
							console.error(error);
							isLoading = false;
							toastStore.trigger({
								message: `The uploaded file is not of a valid .webhapp format: ${error.message}`,
								background: 'variant-filled-error'
							});
						}
					});
				}
			}}
		>
			<InputWithLabel bind:files id="webbhapp" label={`${$i18n.t('uploadYourBundle')}*`} />
			<InputWithLabel
				bind:value={version}
				id="version"
				label={`${$i18n.t('version')}*`}
				maxLength={50}
			/>
			{#if $publishNewVersionMutation.error}
				<div class="flex items-center justify-center">
					<span class="text-red-500">{$publishNewVersionMutation.error.message}</span>
				</div>
			{/if}
			<AddTypeModalFooter
				isPending={$publishNewVersionMutation.isPending || isLoading}
				isValid={isPublishNewVersionDataValid({
					webappPackageId,
					version,
					bytes,
					appEntryId,
					previousHappHash
				})}
				onCancel={modalStore.close}
			/>
		</form>
	</div>
{/if}
