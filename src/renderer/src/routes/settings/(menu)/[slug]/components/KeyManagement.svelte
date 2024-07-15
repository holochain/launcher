<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { showModalError } from '$helpers';
	import { Copy, Download } from '$icons';
	import { i18n, trpc } from '$services';
	import { getErrorMessage } from '$shared/helpers';
	import { importedKeys } from '$stores';

	import { DashedSection } from '../../../components';

	const client = trpc();
	const deriveAndImportSeedFromJsonFile = client.deriveAndImportSeedFromJsonFile.createMutation();
	const modalStore = getModalStore();

	const handleError = (error: unknown) => {
		console.error(error);
		const errorMessage = getErrorMessage(error);
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(errorMessage)
		});
	};

	const handleFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && file.type === 'application/json') {
			console.log(file.path);
			$deriveAndImportSeedFromJsonFile.mutate(file.path, {
				onError: handleError,
				onSuccess: (result) => {
					$importedKeys = [result, ...$importedKeys];
				}
			});
		}
	};
</script>

<DashedSection title={$i18n.t('importSeedFile')}>
	<div class="flex flex-col gap-2 overflow-hidden">
		{#each $importedKeys as key}
			<div class="flex items-center justify-between">
				<span class="truncate whitespace-nowrap">
					<span class="font-semibold">{$i18n.t('importedKey')}:</span>
					<span class="truncate whitespace-nowrap font-light">{` ${key}`}</span>
				</span>
				<Button
					props={{
						class: ' flex',
						onClick: () => navigator.clipboard.writeText(key)
					}}
				>
					<div class="ml-2 mr-1 pt-1"><Copy /></div>
					{$i18n.t('copy')}
				</Button>
			</div>
		{/each}
		<input
			type="file"
			id="file-input"
			class="!hidden"
			accept=".json"
			on:change={handleFileChange}
		/>
		<div class="flex">
			<Button
				props={{
					class: 'btn-install flex',
					onClick: () => document.getElementById('file-input')?.click()
				}}
			>
				<div class="mr-2"><Download /></div>
				{$i18n.t($importedKeys.length ? 'importAdditionalSeed' : 'import')}
			</Button>
		</div>
	</div>
</DashedSection>
