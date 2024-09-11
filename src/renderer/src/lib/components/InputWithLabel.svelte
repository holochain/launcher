<script lang="ts">
	import { Input } from '$components';
	import { createEventDispatcher } from 'svelte';

	export let value: string | null = null;
	export let maxLength: number | undefined = undefined;
	export let id: string;
	export let label: string;
	export let files: FileList | null = null;
	export let largeTextField: boolean = false;

	const dispatch = createEventDispatcher();

	const handleEvent = (type: string) => (event: Event) => dispatch(type, event);

	let isFocused = false;

	$: wordCount = value?.length || 0;

	const handleFocus = () => (isFocused = true);
	const handleBlur = () => (isFocused = false);
</script>

<div class="flex flex-col">
	<div
		class="flex items-center justify-between pb-2"
		class:opacity-100={isFocused}
		class:opacity-60={!isFocused}
	>
		<label for={id} class="text-xs">{label.toUpperCase()}</label>
		{#if maxLength}
			<span class="text-xs">{wordCount}/{maxLength}</span>
		{/if}
	</div>
	{#if largeTextField}
		<div
			class="flex items-stretch rounded-md p-[1px]"
			class:bg-transparent={!isFocused}
			class:bg-app-gradient={isFocused}
		>
			<textarea
				bind:value
				on:focus={handleFocus}
				on:blur={handleBlur}
				on:input
				class="input flex-grow"
				{id}
				maxlength={maxLength}
			></textarea>
		</div>
	{:else}
		<div
			class="rounded-md p-[1px]"
			class:bg-transparent={!isFocused}
			class:bg-app-gradient={isFocused}
		>
			{#if value == undefined}
				<Input
					bind:files
					on:focus={handleFocus}
					on:blur={handleBlur}
					on:input
					props={{
						class: `input`,
						id,
						type: 'file',
						accept: '.webhapp'
					}}
				/>
			{:else}
				<Input
					bind:value
					on:focus={handleFocus}
					on:blur={handleBlur}
					on:input
					props={{
						class: `input`,
						id,
						type: 'text',
						maxlength: maxLength
					}}
				/>
			{/if}
		</div>
	{/if}
</div>
