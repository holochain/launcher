<script lang="ts">
	import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
	export let fractions: number[] = [10, 70, 20, 30, 5]; // fractions in percent
	export let labels: string[] = ['alice', 'bob', 'hello'];
	export let height: number = 30;
	// export let width: string = '100%';

	// let colors = ['#e9f44b', '#bf4bf4', '#f44b4b', '#5cf44b', '#4bf4d0', '#4bb6f4', '#4b4bf4'];
	let colors = [
		'#95a148',
		'#7b34a4',
		'#4ea499',
		'#2e78a6',
		'#3336a4',
		'#a6552e',
		'#a6762e',
		'#2ea63d',
		'#a62e92',
		'#a62e40'
	];
</script>

<div
	class="relative flex flex-1 flex-row overflow-clip"
	style={`height: ${height}px; border-radius: ${height * 0.5}px`}
>
	{#each fractions as fraction, idx}
		<sl-tooltip hoist content={labels[idx]} style={`--sl-tooltip-background-color: ${colors[idx]}; --sl-tooltip-border-radius: 5px; --sl-tooltip-padding: 1px; --sl-tooltip-arrow-size: 6px;`}>
			<div
				style={`width: ${fraction}%; background-color: ${colors[idx]};`}
			></div>
		</sl-tooltip>
	{/each}
</div>
