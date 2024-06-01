import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.strict, ...tseslint.configs.stylistic, {
    ignores: ['src/**/*.d.ts', 'tests/**', 'dist/**'],
    rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
    },
});
