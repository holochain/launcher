<script lang="ts">
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';

	import { Button } from '$components';
	import { MODAL_INSTALL_FROM_FILE } from '$const';
	import { createModalParams } from '$helpers';
	import { i18n } from '$services';

	const modalStore = getModalStore();

	const modal = createModalParams(MODAL_INSTALL_FROM_FILE);
</script>

<button
	on:click={() => modalStore.trigger(modal)}
	class="card flex cursor-pointer items-center p-4 text-start dark:variant-soft-tertiary dark:hover:bg-tertiary-900"
>
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
	<!-- <Button
		props={{
			onClick: () => modalStore.trigger(modal),
			class: 'btn-app-store variant-filled'
		}}
	>
		{$i18n.t('install')}
	</Button> -->
</button>
