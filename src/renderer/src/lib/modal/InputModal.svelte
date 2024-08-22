<script lang="ts">
	import { Input } from '$components';
	import { Edit } from '$icons';

	export let label = '';
	export let id: string;
	export let value: string | undefined;
	export let placeholder = '';
	export let invalidityMsg: string | undefined = undefined;

	let input: Input;

	const getPlaceholder = (isFocused: boolean, placeholder: string): string =>
		isFocused ? '' : placeholder;

	let isFocused = false;

	const handleFocus = () => (isFocused = true);
	const handleBlur = () => (isFocused = false);
</script>

<div>
	<div class="relative">
		<label for={id} class="absolute left-4 top-4 text-xs opacity-60">{label.toUpperCase()}</label>
		<Input
			bind:this={input}
			bind:value
			on:focus={handleFocus}
			on:blur={handleBlur}
			props={{
				class: `px-20 input-modal pt-6 placeholder-white placeholder-semibold`,
				id,
				type: 'text',
				placeholder: getPlaceholder(isFocused, placeholder)
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
	<div class="ml-5 text-sm mb-0 text-rose-600 {invalidityMsg ? '' : 'invisible'}">
		{invalidityMsg}
	</div>
</div>

