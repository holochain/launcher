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
				'button-gradient':
					'linear-gradient(to top right, rgb(0, 212, 225) 15%, rgb(175, 0, 236) 70%)',
				'icon-gradient':
					'linear-gradient(to bottom right, rgb(160, 0, 236) 15%, rgb(0, 85, 90) 70%)',
				'apps-input-dark-gradient': 'linear-gradient(to right, rgb(56, 52, 60), rgb(40, 40, 40))',
				'apps-list-dark-gradient':
					'linear-gradient(10deg, rgb(47, 45, 48) 15%, rgb(14, 17, 19) 45%)'
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
