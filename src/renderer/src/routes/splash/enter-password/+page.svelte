<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	import { goto } from '$app/navigation';
	import { PasswordForm } from '$components';
	import { showModalError } from '$helpers';
	import { i18n, trpc } from '$services';

	const modalStore = getModalStore();

	let passwordInput = '';
	let setupProgress = '';

	const client = trpc();

	const launch = client.launch.createMutation();

	const loginAndLaunch = () => {
		$launch.mutate(
			{ password: passwordInput },
			{
				onSuccess: () => {
					goto('/app');
				},
				onError: (error) => {
					showModalError({
						modalStore,
						errorTitle: $i18n.t('loginError'),
						errorMessage: $i18n.t(error.message || 'unknownError')
					});

					setupProgress = '';
				}
			}
		);
	};

	client.onSetupProgressUpdate.createSubscription(undefined, {
		onData: (data) => {
			setupProgress = data;
		}
	});
</script>

{#if setupProgress}
	<h2 class="h2">{$i18n.t(setupProgress)}</h2>
{:else}
	<h3 class="h3 max-w-56 font-semibold">{$i18n.t('manageAndLaunchApps')}</h3>
	<PasswordForm
		placeholderText={$i18n.t('passwordPlaceholder')}
		buttonAction={loginAndLaunch}
		isDisabled={passwordInput.length < 8 || $launch.isPending}
		bind:value={passwordInput}
	/>
{/if}
