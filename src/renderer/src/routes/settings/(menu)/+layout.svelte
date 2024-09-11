<script lang="ts">
	import { page } from '$app/stores';
	import { DEV_PAGE } from '$const';
	import { createAppQueries } from '$queries';

	import { DevMenu, RegularMenu } from '../components';

	$: isDevPage = $page.url.pathname.includes(DEV_PAGE);

</script>

<div class="flex flex-1 overflow-hidden bg-light-background bg-fixed dark:bg-app-dark-gradient">
	<div
		class="w-[35%] max-w-72 overflow-y-auto bg-light-background bg-fixed shadow-3xl dark:bg-app-dark-gradient"
	>
		<div class="space-y-4 p-4">
			<div class="flex flex-col space-y-1">
				{#if isDevPage}
					<DevMenu />
				{:else}
					<RegularMenu />
				{/if}
			</div>
		</div>
	</div>
	<div class="min-h-[calc(100vh-70px)] flex flex-col flex-1 overflow-y-auto">
		<slot />
	</div>
</div>
