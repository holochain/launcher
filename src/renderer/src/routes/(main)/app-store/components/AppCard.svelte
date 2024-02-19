<script lang="ts">
	import {
		Avatar,
		getModalStore,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { i18n } from '$services';

	import ModalApp from './ModalApp.svelte';

	const modalStore = getModalStore();

	const modalComponent: ModalComponent = { ref: ModalApp };

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent
	};
</script>

<div class="card flex items-center p-4 dark:variant-soft-warning">
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
