import i18next from 'i18next';
import { createI18nStore } from 'svelte-i18next';

import common from '$locale/en/common.json';

i18next.init({
	lng: 'en',
	resources: {
		en: {
			translation: common
		}
	},
	interpolation: {
		escapeValue: false // not needed for svelte as it escapes by default
	}
});

export const i18n = createI18nStore(i18next);
