<script lang="ts">
	import { Button, Input } from '$components';
	import { ArrowRight, PasswordEye } from '$icons';
	import { i18n } from '$services';

	export let placeholderText = $i18n.t('chooseAPassword');
	export let buttonAction: () => void;
	export let value: string | null = null;
	export let isDisabled = false;
	export let widthRem: string | undefined = undefined;

	let showPassword = false;
	const toggleInputType = () => (showPassword = !showPassword);
</script>

<form on:submit|preventDefault={buttonAction} class="flex">
	<div class="relative">
		<Input
			bind:value
			props={{
				autofocus: true,
				class: `input relative pr-8 ${widthRem ? `w-[${widthRem}rem]` : 'max-w-56'} text-sm placeholder-white`,
				type: showPassword ? 'text' : 'password',
				placeholder: placeholderText,
				required: true,
			}}
		/>
		<Button
			props={{
				type: 'button',
				class: 'absolute right-2 top-3',
				onClick: toggleInputType
			}}
		>
			<PasswordEye />
		</Button>
	</div>
	<Button
		props={{
			class: 'btn-next',
			type: 'submit',
			disabled: isDisabled
		}}
	>
		<ArrowRight />
	</Button>
</form>
