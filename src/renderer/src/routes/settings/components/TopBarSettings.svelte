<script lang="ts">
	import clsx from 'clsx';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { IconButton } from '$components';
	import { DEV_PAGE, PUBLISHER_SCREEN, SELECTED_ICON_STYLE } from '$const';
	import { Gear, Upload } from '$icons';
	import { createAppQueries } from '$queries';
	import { trpc } from '$services';
	import { SETTINGS_SCREEN } from '$shared/const';

	const client = trpc();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();

	const { publishersQuery } = createAppQueries();

	$: isDevPage = $page.url.pathname.includes(DEV_PAGE);
</script>

<div class="app-region-drag flex p-3 dark:bg-apps-input-dark-gradient">
	<IconButton
		onClick={() => {
			goto(`/${SETTINGS_SCREEN}`);
		}}
		buttonClass={clsx('p-2', isDevPage ? undefined : 'bg-black rounded-md')}
	>
		{#if isDevPage}
			<Gear />
		{:else}
			<Gear fillColor={SELECTED_ICON_STYLE} />
		{/if}
	</IconButton>
	{#if $isDevhubInstalled.data}
		<IconButton
			buttonClass={clsx('p-2', isDevPage && 'bg-black rounded-md')}
			onClick={() => {
				if (!$publishersQuery.isSuccess) return;

				const targetScreen =
					$publishersQuery.data.length < 1
						? `/${PUBLISHER_SCREEN}`
						: isDevPage
							? `/${SETTINGS_SCREEN}`
							: `/${DEV_PAGE}`;

				goto(targetScreen);
			}}
		>
			{#if isDevPage}
				<Upload fillColor={SELECTED_ICON_STYLE} />
			{:else}
				<Upload />
			{/if}
		</IconButton>
	{/if}
</div>
