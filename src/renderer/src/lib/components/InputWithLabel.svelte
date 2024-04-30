<script lang="ts">
	import { Input } from '$components';

	export let value: string | null = null;
	export let maxLength: number | undefined = undefined;
	export let id: string;
	export let label: string;
	export let files: FileList | null = null;

	let isFocused = false;

	$: wordCount = value?.length || 0;
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
	<div
		class="rounded-md p-[1px]"
		class:bg-transparent={!isFocused}
		class:bg-app-gradient={isFocused}
	>
		{#if value == undefined}
			<Input
				bind:files
				on:focus={() => (isFocused = true)}
				on:blur={() => (isFocused = false)}
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
				on:focus={() => (isFocused = true)}
				on:blur={() => (isFocused = false)}
				props={{
					class: `input`,
					id,
					type: 'text',
					maxlength: maxLength
				}}
			/>
		{/if}
	</div>
</div>
