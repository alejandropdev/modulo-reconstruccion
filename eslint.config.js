import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const sinFechaDelSistema = [
  'error',
  { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Usa el puerto Reloj; no new Date() sin argumentos.' },
  { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'Usa el puerto Reloj; no Date.now().' },
];

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '*.cjs', 'apps/web/vite.config.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/test/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['packages/dominio/src/**/*.ts', 'packages/aplicacion/src/**/*.ts'],
    rules: { 'no-restricted-syntax': sinFechaDelSistema },
  },
);
