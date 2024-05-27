import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('@electron-toolkit/eslint-config-ts/recommended'),
  ...compat.extends('@electron-toolkit/eslint-config-prettier'),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...tseslint.configs.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      'vue/attribute-hyphenation': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { destructuredArrayIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    ignores: [
      'node_modules',
      'dist/',
      'out',
      '.gitignore',
      'rust-utils/',
      '.github/',
      '/.vscode',
      'out-tests',
      'src/renderer/',
      'libs/appstore/dist',
      'scripts',
      'src/main/tests',
    ],
  },
  eslintPluginPrettierRecommended,
];
