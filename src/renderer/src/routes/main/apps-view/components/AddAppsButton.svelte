<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	export let onClick = () => {};
</script>

<button class="flex w-20 shrink-0 snap-start flex-col items-center" on:click={onClick}>
	<Avatar
		border="border-4 border-white border-opacity-20"
		fontSize={250}
		fill="fill-white opacity-50"
		initials="+"
		rounded="rounded-2xl"
		background="bg-transparent"
	/>
	<span class="pt-2 text-xs opacity-50"><slot /></span>
</button>
