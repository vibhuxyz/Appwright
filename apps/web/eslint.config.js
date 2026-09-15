import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      tailwindcss.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      tailwindcss: { cssConfigPath: './src/index.css' },
    },
    rules: {
      // Keeps files scoped to one feature slice instead of growing into a
      // dumping ground — see docs/README.md's frontend organization rules.
      'max-lines': [
        'warn',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'complexity': ['warn', 15],
    },
  },
])
