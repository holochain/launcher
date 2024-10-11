<script lang="ts">
	import { getModalStore, popup } from '@skeletonlabs/skeleton';
	// @ts-expect-error the @spartan-hc/bundles package has no typescript types
	import { Bundle } from '@spartan-hc/bundles';
	import { onMount } from 'svelte';

	import { Button, Input } from '$components';
	import { convertFileToUint8Array } from '$helpers';
	import { Gear, Info } from '$icons';
	import { i18n, trpc } from '$services';
	import type { AppInstallFormData } from '$types';

	import InputModal from './InputModal.svelte';

	const client = trpc();
	const modalStore = getModalStore();

	const installedApps = client.getInstalledApps.createQuery(true);

	export let formData: AppInstallFormData;
	export let files: FileList | null = null;
	export let name: string = '';
	export let onSubmit: () => void;
	export let isPending = false;
	export let acceptFileType = false;

	let showAdvancedInput = false;

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

	$: duplicateAppId = $installedApps.data?.some(
		({ appInfo }) => appInfo.installed_app_id === formData.appId
	);

	$: invalidityMsg = duplicateAppId ? $i18n.t('appIdAlreadyExists') : undefined;

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
		<form class="modal-form flex flex-col space-y-1 p-4" on:submit|preventDefault={onSubmit}>
			{#if acceptFileType}
				<Input
					bind:files
					props={{
						type: 'file',
						id: 'appFile',
						accept: '.webhapp, .happ',
						class: `input-modal pl-2`
					}}
				/>
			{/if}
			<InputModal
				bind:value={formData.appId}
				id="appName"
				label={$i18n.t('name')}
				bind:invalidityMsg
			/>
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
			{#if showAdvancedInput}
				<InputModal bind:value={formData.pubKey} id="pubKey" label={$i18n.t('pubKey')} />
			{/if}
			<footer class="flex justify-between gap-1">
				<Button
					props={{
						type: 'button',
						onClick: () => (showAdvancedInput = !showAdvancedInput),
						class: 'input-button-style w-1/2 flex items-center justify-center gap-1'
					}}
				>
					<div class="scale-75"><Gear /></div>
					<span class="pr-2">{$i18n.t('advanced')}</span>
				</Button>
				<Button
					props={{
						disabled: formData.appId.length === 0 || isPending || !!invalidityMsg,
						type: 'submit',
						isLoading: isPending,
						class: 'btn-app-store-modal w-1/2 !mb-0'
					}}
				>
					<span>{$i18n.t('install')}</span>
				</Button>
			</footer>
		</form>
	</div>
{/if}
