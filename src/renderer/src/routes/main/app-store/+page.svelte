<script lang="ts">
	import {
		Avatar,
		getModalStore,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { i18n } from '$services';

	import { AppStore } from '../../../../../types';
	import MainHeader from '../components/MainHeader.svelte';
	import Modal from './components/Modal.svelte';

	const modalStore = getModalStore();

	const modalComponent: ModalComponent = { ref: Modal };

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent
	};

	let searchInput = '';

	$: isKandoInSearch = 'kando'.includes(searchInput.toLowerCase());

	function handlePress(event: CustomEvent) {
		if (!(event.detail instanceof KeyboardEvent)) return;

		const { key } = event.detail;

		if (key === 'Escape' && searchInput !== '') {
			event.detail.stopPropagation();
			searchInput = '';
		}
	}
</script>

<MainHeader {handlePress} bind:searchInput type={AppStore} />

<div class="grow bg-light-background dark:bg-apps-list-dark-gradient">
	<div class=" text-token grid w-full gap-4 md:grid-cols-2">
		{#if isKandoInSearch}
			<div class="card m-4 flex items-center p-4 dark:variant-soft-warning">
				<Avatar initials={'kn'} rounded="rounded-2xl" background="dark:bg-app-gradient" />
				<div class="ml-4 mr-2 flex-1">
					<h3 class="h3">{$i18n.t('kando')}</h3>
					<p class="line-clamp-2 text-xs leading-[0.8rem] opacity-60">
						Holochain hApp for collaborative KanBan boards. Real-time collaboration delivered by syn
					</p>
				</div>
				<Button
					props={{
						onClick: () => modalStore.trigger(modal),
						class: 'btn-app-store variant-filled'
					}}>{$i18n.t('install')}</Button
				>
			</div>
		{/if}
	</div>
</div>
