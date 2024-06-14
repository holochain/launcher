<script lang="ts">
	import { getModalStore, popup } from '@skeletonlabs/skeleton';
	// @ts-expect-error the @spartan-hc/bundles package has no typescript types
	import { Bundle } from '@spartan-hc/bundles';
	import { onMount } from 'svelte';

	import { Button, Input } from '$components';
	import { convertFileToUint8Array } from '$helpers';
	import { Info } from '$icons';
	import { i18n } from '$services';
	import type { AppInstallFormData } from '$types';

	import InputModal from './InputModal.svelte';

	const modalStore = getModalStore();

	export let formData: AppInstallFormData;
	export let files: FileList | null = null;
	export let name: string = '';
	export let onSubmit: () => void;
	export let isPending = false;
	export let acceptFileType = false;

	onMount(() => {
		if (!acceptFileType) {
			formData.appId = name || $i18n.t('kando');
		}
		if (document.activeElement) {
			(document.activeElement as HTMLElement).blur();
		}
	});

	const setNameByBytes = async (fileList: FileList | null) => {
		if (fileList && fileList.length > 0) {
			const bytes = await convertFileToUint8Array(fileList[0]);

			const bundle = new Bundle(bytes);
			formData.appId = formData.appId || bundle?.name || '';
		}
	};

	$: setNameByBytes(files);
</script>

{#if $modalStore[0]}
	<div
		class="card w-modal relative flex max-w-80 flex-col items-center justify-center !bg-modal-background !ring-transparent"
	>
		<div class="absolute -top-16 z-10">
			<slot name="avatar" />
		</div>
		<header class="pt-4 text-2xl font-bold">
			{name ? name : acceptFileType ? $i18n.t('installFromYourDevice') : $i18n.t('kando')}
		</header>
		<form class="modal-form flex flex-col space-y-4 p-4" on:submit|preventDefault={onSubmit}>
			{#if acceptFileType}
				<Input
					bind:files
					props={{
						type: 'file',
						id: 'appFile',
						accept: '.webhapp',
						class: `input-modal pl-2`
					}}
				/>
			{/if}
			<InputModal bind:value={formData.appId} id="appName" label={$i18n.t('name')} />
			<InputModal
				bind:value={formData.networkSeed}
				id="networkSeed"
				placeholder={$i18n.t('public')}
				label={$i18n.t('network')}
			>
				<div class="absolute right-11 top-3">
					<button
						type="button"
						class="!outline-none [&>*]:pointer-events-none"
						use:popup={{
							event: 'hover',
							target: 'popupHover',
							placement: 'bottom'
						}}
					>
						<Info />
					</button>
				</div>
				<div class="card z-50 min-w-80 !bg-primary-900 p-4" data-popup="popupHover">
					<div class="flex flex-col gap-2">
						<p>{$i18n.t('networkSeed')}</p>
						<span>{$i18n.t('networkSeedDescription')}</span>
					</div>
					<div class="arrow bg-primary-900" />
				</div>
			</InputModal>
			<footer class="modal-footer flex justify-between gap-2">
				<Button
					props={{
						type: 'reset',
						onClick: modalStore.close,
						class: 'btn-app-store-modal-secondary flex-1',
						disabled: isPending
					}}
				>
					{$i18n.t('cancel')}
				</Button>
				<Button
					props={{
						disabled: formData.appId.length === 0 || isPending,
						type: 'submit',
						isLoading: isPending,
						class: 'btn-app-store-modal flex-1'
					}}
				>
					<span>{$i18n.t('install')}</span>
				</Button>
			</footer>
		</form>
	</div>
{/if}
