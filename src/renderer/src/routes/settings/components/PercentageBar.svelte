<script lang="ts">
	import { recursiveSum } from '$helpers';
	import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
  export let values: Record<string, number> = {
    'alice': 3,
    'bob': 5,
    'hello': 8
  };
	export let height: number = 30;
	// export let width: string = '100%';
  export let unit = '';

  const totalSum = recursiveSum(values);

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
	{#each Object.entries(values) as [label, value], idx}
		<sl-tooltip hoist content={`${label} (${Math.round(value)}${unit ? ' ' : ''}${unit})`} style={`--sl-tooltip-background-color: ${colors[idx]}; --sl-tooltip-border-radius: 5px; --sl-tooltip-padding: 1px; --sl-tooltip-arrow-size: 6px;`}>
			<div
				style={`width: ${value/totalSum * 100}%; background-color: ${colors[idx]};`}
			></div>
		</sl-tooltip>
	{/each}
</div>
