<script>
	export let title = '';
	export let borderColor = 'border-white/15';
</script>

<div class="relative p-8">
	<h3 class="h3 absolute left-12 top-5">{title}</h3>
	<div class={`flex items-center rounded-lg border-2 border-dashed p-4 ${borderColor}`}>
		<slot />
	</div>
</div>
