import { skeleton } from '@skeletonlabs/tw-plugin';
import forms from '@tailwindcss/forms';
import { join } from 'path';
import type { Config } from 'tailwindcss';

import { appTheme } from './theme';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			backgroundImage: {
				'login-background': "url('/images/login-background.png')",
				'custom-gradient':
					'linear-gradient(to top right, rgba(0, 212, 225, 1) 15%, rgba(175, 0, 236, 1) 70%)'
			}
		}
	},
	plugins: [
		skeleton({
			themes: {
				custom: [appTheme]
			}
		}),
		forms
	]
} satisfies Config;
