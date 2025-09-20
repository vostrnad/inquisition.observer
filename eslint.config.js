/* eslint-disable @typescript-eslint/naming-convention */
import eslintConfigTypescript from '@vostrnad/eslint-config-typescript'
import eslintConfigVitest from '@vostrnad/eslint-config-vitest'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import globals from 'globals'
import svelteParser from 'svelte-eslint-parser'
import ts from 'typescript-eslint'

export default defineConfig(
  ...eslintConfigTypescript,
  ...eslintPluginSvelte.configs['flat/recommended'],
  eslintConfigVitest,
  eslintConfigPrettier,
  ...eslintPluginSvelte.configs['flat/prettier'],
  {
    settings: {
      'import/internal-regex': '^\\$(app|lib)\\/',
    },
    languageOptions: {
      parser: ts.parser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'mikro-orm.config.ts',
            'eslint.config.js',
            'svelte.config.js',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    files: ['src/routes/**/+page.ts', 'src/routes/**/+server.ts'],
    rules: {
      '@typescript-eslint/only-throw-error': 0,
    },
  },
  {
    files: ['src/**/*.svelte'],
    rules: {
      'unicorn/filename-case': [1, { case: 'pascalCase' }],
    },
  },
  {
    files: ['src/**/+*.svelte'],
    rules: {
      'unicorn/filename-case': [1, { case: 'camelCase' }],
    },
  },
  {
    ignores: [
      'build/',
      'coverage/',
      '.svelte-kit/',
      'dist/',
      'vite.config.js.timestamp-*',
      'vite.config.ts.timestamp-*',
    ],
  },
)
