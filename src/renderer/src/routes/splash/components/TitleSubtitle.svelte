<script lang="ts">
	export let title: string = '';
	export let subtitle: string = '';
</script>

<h1 class="h1">{title}</h1>
{#if subtitle}
	<h3 class="h3">{subtitle}</h3>
{/if}
