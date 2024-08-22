<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { i18n } from '$services';
	import PasswordForm from '../../routes/(splash)/components/PasswordForm.svelte';

	const modalStore = getModalStore();

	let passwordInput: string | undefined = undefined;

	const handleContinue = () => {
		$modalStore[0]?.response?.(passwordInput);
    passwordInput = undefined;
    modalStore.close();
	};
</script>

{#if $modalStore[0]}
	<div class="flex flex-col items-center gap-4 bg-modal-background p-4 rounded-md">
		<p class="mb-1 max-w-72 p-4 leading-tight">
      Enter the passphrase to decrypt the device bundle:
			<!-- {$i18n.t('theDeveloperToolkitSyncs')} -->
		</p>
		<PasswordForm
			placeholderText={$i18n.t('passwordPlaceholder')}
			buttonAction={handleContinue}
			isDisabled={(passwordInput && passwordInput.length < 1) || false}
			bind:value={passwordInput}
		/>
	</div>
{/if}
