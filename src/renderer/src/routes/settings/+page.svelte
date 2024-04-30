<script>
	import { i18n, trpc } from '$services';

	const client = trpc();
	const holochainVersion = client.holochainVersion.createQuery();
</script>

<div class="p-4">
	<div>
		<h3 class="h3">{$i18n.t('holochainVersion')}</h3>
		{#if $holochainVersion.data}
			<p>
				{$holochainVersion.data.type}{#if 'version' in $holochainVersion.data}: {$holochainVersion
						.data.version}{/if}
			</p>
		{/if}
	</div>
</div>
