<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, CenterProgressRadial, IconInput, InputWithLabel } from '$components';
	import { DEV_PAGE, PUBLISHER_SCREEN } from '$const';
	import { capitalizeFirstLetter, showModalError } from '$helpers';
	import { Publisher } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { UpdatePublisherInput } from 'appstore-tools';
	import { onDestroy } from 'svelte';

	const { publishersQuery, updatePublisherMutation } = createAppQueries();

	const modalStore = getModalStore();

	let updatePublisherInput: UpdatePublisherInput = {};

	let icon: Uint8Array | undefined;

	const handleFileUpload = async (file: Uint8Array): Promise<void> => {
		updatePublisherInput.icon = file;
	};

	const handlePublisherNameChange = (e: Event) => {
		updatePublisherInput.name = (e.target as HTMLInputElement).value;
	};

	const handlepublisherLocationChange = (e: Event) => {
		updatePublisherInput.location = (e.target as HTMLInputElement).value;
	};

	const handlepublisherWebsiteChange = (e: Event) => {
		updatePublisherInput.website = {
			url: (e.target as HTMLInputElement).value,
			context: undefined
		};
	};

	const unsubscribe = publishersQuery.subscribe((value) => {
		if (value.data && value.data.length > 0) {
			icon = (value.data[0].content.icon);
		}
	})

	onDestroy(unsubscribe);
</script>

{#if !$publishersQuery.data}
	<div class="flex flex-1 flex-col items-center justify-center">
		<CenterProgressRadial width="w-12" />
	</div>
{:else if $publishersQuery.data.length < 1}
	<div class="flex flex-1 flex-col items-center justify-center">
		<Publisher />
		<h2 class="h2 pt-2">{$i18n.t('publishingDashboard')}</h2>
		<p class="mb-4 max-w-sm text-center font-[400]">
			{$i18n.t('welcomeToTheHolochainLauncherDeveloperDashboard')}
		</p>
		<Button
			props={{
				type: 'button',
				onClick: () => goto(`/${PUBLISHER_SCREEN}/add`),
				class: 'btn-happ-button mt-4'
			}}
		>
			<span>{$i18n.t('setUpYourPublisherProfile')}</span>
		</Button>
	</div>
{:else}
	{@const currentPublisherData = $publishersQuery.data[0]}
	<div class="flex flex-1 flex-col items-center justify-center">
		<header class="mb-4 pt-4 text-2xl font-bold">
			{$i18n.t('yourPublisherProfile')}
		</header>
		<form
			class="modal-form flex min-w-80 flex-col space-y-4 p-4"
			on:submit|preventDefault={() => {
				const payload = {
					base: currentPublisherData.action,
					properties: updatePublisherInput
				};
				$updatePublisherMutation.mutate(payload, {
					onSuccess: (result) => {
						console.log('Published successfully: ', result);
						goto(`/${DEV_PAGE}`);
					},
					onError: (error) => {
						modalStore.close();
						console.error(error);
						showModalError({
							modalStore,
							errorTitle: $i18n.t('appError'),
							errorMessage: $i18n.t(error.message)
						});
					}
				});
			}}
		>
			<IconInput bind:icon={icon} {handleFileUpload} />
			<InputWithLabel
				value={currentPublisherData.content.name}
				id="publisherName"
				label={$i18n.t('name')}
				on:input={handlePublisherNameChange}
			/>
			<InputWithLabel
				value={currentPublisherData.content.location}
				id="publisherLocation"
				label={$i18n.t('location')}
				on:input={handlepublisherLocationChange}
			/>
			<InputWithLabel
				value={currentPublisherData.content.website.url}
				id="publisherWebsite"
				label={capitalizeFirstLetter($i18n.t('website'))}
				on:input={handlepublisherWebsiteChange}
			/>

			<footer class="flex justify-between gap-2">
				<Button
					props={{
						disabled: $updatePublisherMutation.isPending,
						isLoading: $updatePublisherMutation.isPending,
						type: 'submit',
						class: 'btn-happ-button flex-1'
					}}
				>
					<span>{capitalizeFirstLetter($i18n.t('update'))}</span>
				</Button>
			</footer>
		</form>
	</div>
{/if}
