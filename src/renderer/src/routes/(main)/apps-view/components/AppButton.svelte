<script lang="ts">
	import clsx from 'clsx';

	import { createImageUrl } from '$helpers';
	import type { ExtendedAppInfo } from '$shared/types';

	import BaseButton from './BaseButton.svelte';
	import TooltipForTruncate from './TooltipForTruncate.svelte';

	export let app: ExtendedAppInfo;
	export let index: number;
	export let isSearchInputFilled: boolean;
	export let onClick = () => {};

	$: isDisabled = app.appInfo.status !== 'running' && 'disabled' in app.appInfo.status;
	$: willBeOpen = isSearchInputFilled && index === 0;
	$: borderClasses = clsx('border-4', {
		'dark:border-2 border-white': willBeOpen,
		'dark:border-0': !willBeOpen
	});

	$: imageUrl = app.icon ? createImageUrl(app.icon) : undefined;
</script>

<BaseButton
	onClick={() => {
		if (!isDisabled) onClick();
	}}
	src={imageUrl}
	initials={app.appInfo.installed_app_id}
	border={borderClasses}
	background="dark:bg-app-gradient"
	{isDisabled}
	shouldGreyOut={!willBeOpen && isSearchInputFilled}
>
	<TooltipForTruncate text={app.appInfo.installed_app_id} />
</BaseButton>
