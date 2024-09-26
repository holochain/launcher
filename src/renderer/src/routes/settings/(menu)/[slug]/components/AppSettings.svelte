<script lang="ts">
	import type { IssueAppAuthenticationTokenResponse } from '@holochain/client';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import clsx from 'clsx';
	import { Base64 } from 'js-base64';

	import { Button } from '$components';
	import InputWithLabel from '$components/InputWithLabel.svelte';
	import TrashCan from '$icons/TrashCan.svelte';
	import { i18n, trpc } from '$services';
	import type { ExtendedAppInfo } from '$shared/types';

	import DashedSection from '../../../components/DashedSection.svelte';

	const client = trpc();

	const toastStore = getToastStore();

	const issueAuthTokenMutation = client.issueAuthenticationToken.createMutation();

	export let uninstallLogic: () => void;
	export let update: boolean;

	export let app: ExtendedAppInfo;

	let showAdvanced = false;

	let authTokenResponses: IssueAppAuthenticationTokenResponse[] = [];

	let agentToGrantSigningCredentials: string = '';

	const issueAuthToken = () => {
		console.log('Issuing token');
		$issueAuthTokenMutation.mutate(app, {
			onSuccess: (tokenResponse) => {
				authTokenResponses = [...authTokenResponses, tokenResponse];
				toastStore.trigger({
					message: `Authentication token created.`,
					background: 'variant-filled-success'
				});
			},
			onError: (error) => {
				toastStore.trigger({
					message: `Failed to generate authentication token: ${error.message}`,
					background: 'variant-filled-error'
				});
			}
		});
	};
</script>

<div class={clsx(update && 'pt-0')}>
	{#if !app.isHeadless}
		<DashedSection containerClasses="m-2 p-2.5" title={$i18n.t('uninstallApp')}>
			<div class="flex-end flex flex-1 flex-row items-center">
				<span class="flex-1">{$i18n.t('uninstallAppAndRemoveAllData')}</span>
				<Button
					props={{
						class: 'btn-secondary flex-1 text-al max-w-28',
						onClick: uninstallLogic
					}}
				>
					<div class="flex flex-row items-center">
						<TrashCan color={'white'} />
						<span class="ml-1">{$i18n.t('uninstall')}</span>
					</div>
				</Button>
			</div>
		</DashedSection>
	{:else}
		<div class="p-4">No Settings available for this app.</div>
	{/if}
	{#if showAdvanced}
		<DashedSection
			containerClasses="m-2 p-2.5"
			title={$i18n.t('Connect External Clients (Advanced)')}
		>
			<div class="flex-1 flex-col">
				<div class="mb-4 flex-col rounded-lg bg-amber-400 p-2 text-black">
					<div class="mb-2 font-bold">⚠️ {$i18n.t('WARNING')}:</div>
					<div class="ml-2">
						{$i18n.t(
							'The settings below can allow others to take actions for this app on your behalf.'
						)}
					</div>
				</div>
				<div class="flex-end flex flex-1 flex-row items-center">
					<span class="flex-1"
						>{$i18n.t('Generate a one-time, expiring authentication token.')}</span
					>
					<Button
						props={{
							class: 'btn-secondary flex-1 text-al max-w-28',
							onClick: issueAuthToken,
							disabled: $issueAuthTokenMutation.isPending
						}}
					>
						<div class="flex flex-row items-center">
							<span class="font-extrabold">+</span>
							<span class="ml-1">{$i18n.t('Generate')}</span>
						</div>
					</Button>
				</div>
				{#each authTokenResponses.sort((r1, r2) => {
					if (r1.expires_at && r2.expires_at) return r2.expires_at - r1.expires_at;
					if (r1.expires_at) return -1;
					if (r2.expires_at) return 1;
					return 0;
				}) as response}
					<div class="column card mb-2 mb-2 items-center p-3 text-base dark:variant-soft-tertiary">
						{#if response.expires_at}
							<div class="row flex-end flex text-sm opacity-60">
								<span class="flex-1"></span>
								{$i18n.t('expires')}
								{new Date(response.expires_at / 1000)}
							</div>
						{/if}
						<button
							class="mt-1 break-all text-left hover:text-white"
							title={$i18n.t('Click to Copy')}
							on:click={() => {
								navigator.clipboard.writeText(
									Base64.fromUint8Array(new Uint8Array(response.token))
								);
								toastStore.trigger({
									message: `Copied.`
								});
							}}
						>
							{Base64.fromUint8Array(new Uint8Array(response.token))}
						</button>
					</div>
				{/each}
				<hr class="divider mb-4 mt-4 opacity-60" />
				<div class="flex flex-1 flex-col">
					<div class="flex-1 font-bold">
						{$i18n.t('Grant permission to someone to take actions on your behalf:')}
					</div>
					<InputWithLabel
						bind:value={agentToGrantSigningCredentials}
						id="pubkeyInput"
						label={$i18n.t('publicKey')}
					/>
					<span class="h-2"></span>
					<Button
						props={{
							class: 'btn-secondary flex-1 text-al'
						}}
					>
						<div class="flex flex-row items-center">
							<span class="font-extrabold">+</span>
							<span class="ml-1">{$i18n.t('Grant Permission')}</span>
						</div>
					</Button>
				</div>
			</div>
		</DashedSection>
	{:else}
		<div class="mt-4 flex flex-1 flex-row justify-center">
			<span class="flex-1"></span>
			<Button
				props={{
					class: 'btn-secondary flex-1 text-al',
					onClick: () => {
						showAdvanced = true;
					}
				}}
			>
				<span class="ml-1">{$i18n.t('Show Advanced Settings')}</span>
			</Button>
			<span class="flex-1"></span>
		</div>
	{/if}
	<slot />
</div>
