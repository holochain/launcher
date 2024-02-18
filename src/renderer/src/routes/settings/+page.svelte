<script lang="ts">
	import { i18n, trpc } from '$services';

	const client = trpc();

	const holochainVersion = client.holochainVersion.createQuery();
</script>

<div>
	<h2 class="text-lg font-bold">{$i18n.t('holochainVersion')}</h2>
	{#if $holochainVersion.data}
		<p>
			{$holochainVersion.data.type}{#if 'version' in $holochainVersion.data}: {$holochainVersion
					.data.version}{/if}
		</p>
	{/if}
</div>
