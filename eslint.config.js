/* eslint-disable @typescript-eslint/naming-convention */
import eslintConfigTypescript from '@vostrnad/eslint-config-typescript'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import globals from 'globals'
import svelteParser from 'svelte-eslint-parser'
import ts from 'typescript-eslint'

export default ts.config(
  ...eslintConfigTypescript,
  ...eslintPluginSvelte.configs['flat/recommended'],
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
            'drizzle.config.ts',
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
    ignores: ['build/', '.svelte-kit/', 'dist/'],
  },
)
