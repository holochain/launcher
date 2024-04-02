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
			colors: {
				'light-primary': 'rgb(25, 182, 227)',
				'light-background': 'rgba(0, 102, 255, 0.1)'
			},
			backgroundImage: {
				'login-background': "url('/images/login-background.png')",
				'button-gradient':
					'linear-gradient(to top right, rgb(0, 212, 225) 15%, rgb(175, 0, 236) 70%)',
				'app-gradient':
					'linear-gradient(to bottom right, rgb(160, 0, 236) 15%, rgb(0, 85, 90) 70%)',
				'apps-input-dark-gradient': 'linear-gradient(to right, rgb(56, 52, 60), rgb(40, 40, 40))',
				'apps-list-dark-gradient':
					'linear-gradient(10deg, rgb(47, 45, 48) 15%, rgb(14, 17, 19) 45%)',
				'settings-dark-gradient': `linear-gradient(350deg, rgba(0, 82, 205, 0.15) 5.32%, rgba(0, 0, 0, 0) 88.82%), linear-gradient(0deg, rgb(32, 33, 34), rgb(14, 17, 19)), linear-gradient(0deg, rgb(14, 17, 19), rgb(14, 17, 19))`,
				'add-happ-button': `linear-gradient(92.56deg, rgb(7, 194, 69) 20%, rgb(12, 142, 156) 84%)`,
				'app-button-gradient':
					'linear-gradient(92.56deg, #584BA8 -0.56%, rgba(158, 0, 255, 0.51) 97.18%)'
			},
			boxShadow: {
				'3xl': '0 35px 60px -15px rgba(0, 0, 0)'
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
