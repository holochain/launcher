<script>
	export let title = '';
	export let borderColor = 'border-white/15';
</script>

<div class="relative m-2 p-2.5">
	<h3 class="h3 absolute left-6 top-0">{title}</h3>
	<div class={`flex items-center rounded-lg border-2 border-dashed p-4 overflow-x-auto ${borderColor}`}>
		<slot />
	</div>
</div>
