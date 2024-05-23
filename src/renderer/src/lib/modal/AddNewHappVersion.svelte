<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	// @ts-expect-error the @spartan-hc/bundles package has no typescript types
	import { Bundle } from '@spartan-hc/bundles';
	import type { AppVersionEntry, Entity } from 'appstore-tools';

	import { AddTypeModalFooter, InputWithLabel } from '$components';
	import { convertFileToUint8Array } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { isPublishNewVersionDataValid } from '$types';

	const { publishNewVersionMutation } = createAppQueries();

	const modalStore = getModalStore();

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
			const convertedBytes = await convertFileToUint8Array(files[0]);
			bytes = convertedBytes;

			const bundle = new Bundle(convertedBytes);
			version = version || bundle?.manifest?.version || '';
		}
	};

	$: setAppDataBytes(files);
</script>

{#if $modalStore[0]}
	<div
		class="card w-modal flex flex-col items-center justify-center !bg-transparent !ring-transparent"
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
					$publishNewVersionMutation.mutate(publishNewVersionData, {
						onSuccess: () => {
							modalStore.close();
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
				maxLength={10}
			/>
			{#if $publishNewVersionMutation.error}
				<div class="flex items-center justify-center">
					<span class="text-red-500">{$publishNewVersionMutation.error.message}</span>
				</div>
			{/if}
			<AddTypeModalFooter
				isPending={$publishNewVersionMutation.isPending}
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
