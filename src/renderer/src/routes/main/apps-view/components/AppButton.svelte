<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';

	import type { ExtendedAppInfo } from '../../../../../../types';
	import TooltipForTruncate from './TooltipForTruncate.svelte';

	export let app: ExtendedAppInfo;
	export let isDisabled: boolean;
	export let shouldGreyOut: boolean;
	export let onClick = () => {};
</script>

<button
	class:cursor-not-allowed={isDisabled}
	class:opacity-50={isDisabled || shouldGreyOut}
	class="flex w-20 snap-start flex-col items-center"
	on:click={() => {
		if (!isDisabled) onClick();
	}}
>
	<Avatar
		initials={app.appInfo.installed_app_id}
		border="border-4 dark:border-0"
		rounded="rounded-2xl"
		background="dark:bg-app-gradient"
	/>
	<TooltipForTruncate text={app.appInfo.installed_app_id} />
</button>
