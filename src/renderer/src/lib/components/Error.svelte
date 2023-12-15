<script>
	import { i18n } from '$services';

	export let text = '';

	$: translatedError = $i18n.t(text || 'unknownError');
</script>

<div class={'input-error'}>
	{translatedError}
</div>
