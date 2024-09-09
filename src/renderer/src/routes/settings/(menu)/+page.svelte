<script>
	import { i18n, trpc } from '$services';

	const client = trpc();
	const defaultHolochainVersion = client.defaultHolochainVersion.createQuery();
</script>

<div class="p-5">
	<div>
		<h3 class="h3">{$i18n.t('holochainVersion')}</h3>
		{#if $defaultHolochainVersion.data}
			<p>
				{$defaultHolochainVersion.data.type}{#if 'version' in $defaultHolochainVersion.data}: {$defaultHolochainVersion
						.data.version}{/if}
			</p>
		{/if}
	</div>
</div>
