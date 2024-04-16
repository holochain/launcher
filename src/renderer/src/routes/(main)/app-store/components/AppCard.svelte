<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import { createImageUrl } from '$helpers';
	import { i18n } from '$services';

	export let icon: Uint8Array | undefined = undefined;
	export let title: string = $i18n.t('kando');
	export let subtitle: string =
		'Holochain hApp for collaborative KanBan boards. Real-time collaboration delivered by syn';

	$: imageUrl = createImageUrl(icon);
</script>

<div class="min-w-16">
	<Avatar src={imageUrl} initials={'kn'} rounded="rounded-2xl" background="dark:bg-app-gradient" />
</div>
<div class="ml-4 mr-2 flex flex-col items-start">
	<h3 class="h3">{title}</h3>
	<p class="line-clamp-2 text-left text-xs leading-[0.8rem] opacity-60">{subtitle}</p>
</div>
