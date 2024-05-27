import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...eslintPluginSvelte.configs['flat/recommended'],
	{
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: {
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error'
		},
		ignores: ['.DS_Store', 'node_modules', '/.svelte-kit']
	},
	{
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2022,
			sourceType: 'module',
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		files: ['**/*.js'],
		extends: [tseslint.configs.disableTypeChecked]
	},
	{
		files: ['**/*.svelte', '*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			},
			globals: {
				...globals.browser
			}
		}
	},
	eslintPluginPrettierRecommended
];
