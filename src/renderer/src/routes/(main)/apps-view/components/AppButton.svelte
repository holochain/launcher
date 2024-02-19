<script lang="ts">
	import type { ExtendedAppInfo } from '../../../../../../types';
	import BaseButton from './BaseButton.svelte';
	import TooltipForTruncate from './TooltipForTruncate.svelte';

	export let app: ExtendedAppInfo;
	export let isDisabled: boolean;
	export let shouldGreyOut: boolean;
	export let onClick = () => {};
</script>

<BaseButton
	onClick={() => {
		if (!isDisabled) onClick();
	}}
	initials={app.appInfo.installed_app_id}
	border="border-4 dark:border-0"
	background="dark:bg-app-gradient"
	{isDisabled}
	{shouldGreyOut}
>
	<TooltipForTruncate text={app.appInfo.installed_app_id} />
</BaseButton>
