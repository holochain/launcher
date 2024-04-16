<script lang="ts">
	import { Avatar, getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { MODAL_INSTALL_KANDO } from '$const';
	import { createImageUrl, createModalParams } from '$helpers';
	import { i18n } from '$services';
	import { APP_STORE } from '$shared/const';

	export let icon: Uint8Array | undefined = undefined;
	export let title: string = $i18n.t('kando');
	export let id: string | undefined = undefined;
	export let subtitle: string =
		'Holochain hApp for collaborative KanBan boards. Real-time collaboration delivered by syn';

	const modalStore = getModalStore();

	const modal = createModalParams(MODAL_INSTALL_KANDO);

	$: imageUrl = createImageUrl(icon);
</script>

<button
	on:click={() => (id === undefined ? modalStore.trigger(modal) : goto(`/${APP_STORE}/${id}`))}
	class="cursor-pointera card flex items-center p-4 dark:variant-soft-warning"
>
	<Avatar src={imageUrl} initials={'kn'} rounded="rounded-2xl" background="dark:bg-app-gradient" />

	<div class="ml-4 mr-2 flex flex-col items-start">
		<h3 class="h3">{title}</h3>
		<p class="line-clamp-2 text-left text-xs leading-[0.8rem] opacity-60">{subtitle}</p>
	</div>
</button>
