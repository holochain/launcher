<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { AddTypeModalFooter, InputWithLabel } from '$components';
	import { convertFileToUint8Array } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { isPublishNewVersionDataValid } from '$types';

	const { publishNewVersionMutation } = createAppQueries();

	const modalStore = getModalStore();

	export let webappPackageId: Uint8Array;
	export let appEntryId: Uint8Array;
	let files: FileList | null = null;
	let version = '';
	let bytes: Uint8Array | undefined;

	const setAppDataBytes = async (files: FileList | null) => {
		bytes = files && files.length > 0 ? await convertFileToUint8Array(files[0]) : undefined;
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
					appEntryId
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
			<InputWithLabel bind:files id="webbhapp" label={$i18n.t('webbhapp')} />
			<InputWithLabel bind:value={version} id="version" label={$i18n.t('version')} maxLength={10} />
			{#if $publishNewVersionMutation.error}
				<div class="flex items-center justify-center">
					<span class="text-red-500">{$publishNewVersionMutation.error.message}</span>
				</div>
			{/if}
			<AddTypeModalFooter
				isPending={$publishNewVersionMutation.isPending}
				isValid={isPublishNewVersionDataValid({ webappPackageId, version, bytes, appEntryId })}
				onCancel={modalStore.close}
			/>
		</form>
	</div>
{/if}
