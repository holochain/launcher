<script lang="ts">
	import {
		Avatar,
		getModalStore,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { i18n } from '$services';

	import ModalFromWebhapp from './ModalFromWebhapp.svelte';

	const modalStore = getModalStore();

	const modalComponent: ModalComponent = { ref: ModalFromWebhapp };

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent
	};
</script>

<div class="card dark:variant-soft-warning flex items-center p-4">
	<Avatar
		border="border-4 border-white border-opacity-20"
		fontSize={250}
		fill="fill-white opacity-50"
		initials="+"
		rounded="rounded-2xl"
		background="bg-transparent"
	/>
	<div class="ml-4 mr-2 flex-1">
		<h3 class="h3">{$i18n.t('installFromYourDevice')}</h3>
		<p class="line-clamp-2 text-xs leading-[0.8rem] opacity-60">
			{$i18n.t('useWebhappFileToAddHapp')}
		</p>
	</div>
	<Button
		props={{
			onClick: () => modalStore.trigger(modal),
			class: 'btn-app-store variant-filled'
		}}
	>
		{$i18n.t('install')}
	</Button>
</div>
