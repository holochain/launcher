<script lang="ts">
	import { InputHome, ListOfApps } from '$components';

	let searchInput = '';
</script>

<div class="flex h-full flex-col">
	<InputHome bind:searchInput />
	<ListOfApps {searchInput} />
</div>
