<script lang="ts">
	import { page } from '$app/stores';
	import { AppDetailsPanel, Button } from '$components';
	import { createImageUrl, uint8ArrayToURIComponent } from '$helpers';
	import { createAppQueries } from '$queries';
	import { i18n } from '$services';

	const { appStoreHappsQuery, appVersionsAppstoreQueryFunction } = createAppQueries();

	const slug: string = $page.params.slug;
	let selectedIndex = 0;
	const app = $appStoreHappsQuery.data?.find(({ id }) => uint8ArrayToURIComponent(id) === slug);

	$: appVersionsDetailsQuery = app ? appVersionsAppstoreQueryFunction(app.id) : undefined;
</script>

{#if app}
	<AppDetailsPanel
		imageUrl={createImageUrl(app.icon)}
		title={app.title}
		subtitle={app.subtitle}
		buttons={[$i18n.t('description'), $i18n.t('versionHistory')]}
		bind:selectedIndex
	>
		<div slot="install">
			<Button
				props={{
					class: 'btn-app-store variant-filled',
					onClick: () => {}
				}}
			>
				{$i18n.t('install')}
			</Button>
		</div>
	</AppDetailsPanel>
{/if}

{#if $appVersionsDetailsQuery?.data}
	{#if selectedIndex === 1}
		{#each $appVersionsDetailsQuery.data as versionEntry}
			<div class="flex w-full items-center justify-between px-8 pt-2">
				<h4 class="font-semibold">{versionEntry.content.version}</h4>
				<Button
					props={{
						class: 'btn-app-store variant-filled',
						onClick: () => {}
					}}
				>
					{$i18n.t('install')}
				</Button>
			</div>
		{/each}
	{/if}
{/if}
