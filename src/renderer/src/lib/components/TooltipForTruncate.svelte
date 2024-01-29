<script>
	export let text = '';
</script>

<div class="group relative w-full cursor-pointer">
	<span class="block truncate pt-2 text-xs">
		{text}
	</span>
	{#if text.length > 14}
		<span
			class="invisible absolute bottom-full left-1/2 z-10 w-max -translate-x-1/2 transform rounded-md bg-gray-700 p-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
		>
			{text}
		</span>
	{/if}
</div>
