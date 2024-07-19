<script lang="ts">
	import clsx from 'clsx';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { IconButton } from '$components';
	import { DEV_PAGE, PUBLISHER_SCREEN, SELECTED_ICON_STYLE } from '$const';
	import { Gear, Upload } from '$icons';
	import { createAppQueries } from '$queries';
	import { i18n, trpc } from '$services';
	import { SETTINGS_WINDOW } from '$shared/const';

	const client = trpc();
	const isDevhubInstalled = client.isDevhubInstalled.createQuery();

	client.hideSettingsWindow.createSubscription(undefined, {
		onData: (value) => {
			if (value) {
				goto(`/${SETTINGS_WINDOW}`);
			}
		}
	});

	const { publishersQuery } = createAppQueries();

	$: isDevPage = $page.url.pathname.includes(DEV_PAGE);
</script>

<div class="app-region-drag flex p-3 dark:bg-apps-input-dark-gradient">
	<IconButton
		onClick={() => {
			goto(`/${SETTINGS_WINDOW}`);
		}}
		buttonClass={clsx('p-2 mr-2', isDevPage ? undefined : 'bg-black rounded-md')}
	>
		<div class="flex flex-row items-center gap-2">
			{#if isDevPage}
				<Gear />
			{:else}
				<Gear fillColor={SELECTED_ICON_STYLE} />
			{/if}
			<span class={clsx(isDevPage && 'text-black dark:text-tertiary-400')}
				>{$i18n.t('settings')}</span
			>
		</div>
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
							? `/${SETTINGS_WINDOW}`
							: `/${DEV_PAGE}`;

				goto(targetScreen);
			}}
		>
			<div class="flex flex-row items-center gap-2">
				{#if isDevPage}
					<Upload fillColor={SELECTED_ICON_STYLE} />
				{:else}
					<Upload />
				{/if}
				<span class={clsx(isDevPage ? '' : 'text-black dark:text-tertiary-400')}
					>{$i18n.t('publish')}</span
				>
			</div>
		</IconButton>
	{/if}
</div>
