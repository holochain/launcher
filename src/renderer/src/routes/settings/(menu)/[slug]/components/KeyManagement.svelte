<script lang="ts">
	import { getModalStore, getToastStore, SlideToggle } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { createModalParams, showModalError } from '$helpers';
	import { Copy, Download } from '$icons';
	import { i18n, trpc } from '$services';
	import { getErrorMessage } from '$shared/helpers';
	import { importedKeys } from '$stores';

	import { DashedSection } from '../../../components';
	import { MODAL_ENTER_PASSPHRASE } from '$const';
	import type { Modals } from '$types';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	const client = trpc();

	const deriveAndImportSeedFromJsonFile = client.deriveAndImportSeedFromJsonFile.createMutation();

	let insecurePassphraseCollection = true;

	const clearFileInput = () => {
		const fileInput = document.getElementById('file-input-device-bundle') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	};

	const handleError = (error: unknown) => {
		console.error(error);
		const errorMessage = getErrorMessage(error);
		showModalError({
			modalStore,
			errorTitle: $i18n.t('appError'),
			errorMessage: $i18n.t(errorMessage)
		});
		clearFileInput();
	};

	const handleFileChange = async (event: Event) => {
		if (insecurePassphraseCollection) {
			showEnterPassphraseModal();
			return;
		}
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && file.type === 'application/json') {
			$deriveAndImportSeedFromJsonFile.mutate({ filePath: file.path }, {
				onError: handleError,
				onSuccess: (result) => {
					$importedKeys = [result, ...$importedKeys];
					clearFileInput();
				}
			});
		}
	};

	const showModal = (modalType: Modals, response?: (r: unknown) => void) => {
		const modal = createModalParams(modalType, response);
		modalStore.trigger(modal);
	};

	const showEnterPassphraseModal = () => {
		showModal(MODAL_ENTER_PASSPHRASE, (passphrase) => {
			if (passphrase === undefined || !passphrase) {
				clearFileInput();
				return;
			}
			const fileInputEl = document.getElementById('file-input-device-bundle') as HTMLInputElement;
			// const target = event.target as HTMLInputElement;
			const file = fileInputEl?.files?.[0];
			if (!file) {
				handleError('No file selected.');
				return;
			}
			$deriveAndImportSeedFromJsonFile.mutate(
				{ filePath: file.path, passphrase: passphrase as string },
				{
					onError: (e) => {
						// Required for some reason to not have the error modal be closed.
						setTimeout(() => {
							passphrase = undefined;
							handleError(e);
						}, 200);
					},
					onSuccess: (result) => {
						$importedKeys = [result, ...$importedKeys];
						clearFileInput();
						passphrase = undefined;
					}
				}
			);
		});
	};
</script>
<div class="py-3">

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
						onClick: async () => {
							await navigator.clipboard.writeText(key);
							toastStore.trigger({
								message: $i18n.t('copiedToClipboard')
							});
						}
					}}
				>
					<div class="ml-2 mr-1 pt-1"><Copy /></div>
					{$i18n.t('copy')}
				</Button>
			</div>
		{/each}
		<input
			type="file"
			id="file-input-device-bundle"
			class="!hidden"
			accept=".json"
			on:change={handleFileChange}
		/>
		<div class="flex items-center">
			<Button
				props={{
					class: 'btn-install flex',
					onClick: () => document.getElementById('file-input-device-bundle')?.click()
				}}
			>
				<div class="mr-2"><Download /></div>
				{$i18n.t($importedKeys.length ? 'importAdditionalSeed' : 'import')}
			</Button>
			<!-- <SlideToggle
				on:click={() => {
					insecurePassphraseCollection = !insecurePassphraseCollection;
				}}
				checked={insecurePassphraseCollection}
				active="bg-warning-500"
				name="enable-insecure-passphrase-collection-slider"
				size="sm"
				class="bg-yellow"
			>
				{insecurePassphraseCollection ? 'disable' : 'enable'} less secure passphrase collection
			</SlideToggle> -->
		</div>
	</div>
</DashedSection>
</div>