<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	export let onClick = () => {};
	export let initials: string = '';
	export let src: string | undefined = undefined;
	export let border: string = 'border-4 border-white border-opacity-20 hover:border-opacity-30';
	export let fontSize: number | undefined = undefined;
	export let fill: string = 'fill-white';
	export let background: string = 'bg-transparent';
	export let isDisabled: boolean = false;
	export let shouldGreyOut: boolean = false;
</script>

<button
	class:cursor-not-allowed={isDisabled}
	class:opacity-50={isDisabled || shouldGreyOut}
	class="flex w-20 shrink-0 snap-start flex-col items-center"
	on:click={() => {
		if (!isDisabled) onClick();
	}}
>
	<Avatar rounded="rounded-2xl" {src} {initials} {border} {fontSize} {fill} {background} />
	<slot />
</button>
