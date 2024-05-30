<script lang="ts">
	import { Input } from '$components';
	import { Edit } from '$icons';

	export let label = '';
	export let id: string;
	export let value: string;
	export let placeholder = '';

	let input: Input;
</script>

<div class="relative">
	<label for={id} class="absolute left-4 top-4 text-xs opacity-60">{label.toUpperCase()}</label>
	<Input
		bind:this={input}
		bind:value
		props={{
			class: `px-20 input-modal pt-6 placeholder-white placeholder-semibold`,
			id,
			type: 'text',
			placeholder
		}}
	/>
	<slot />
	<button
		type="button"
		class="absolute right-4 top-3 !outline-none"
		on:click={input.focusInput}
		aria-label="Edit input"
	>
		<Edit />
	</button>
</div>
