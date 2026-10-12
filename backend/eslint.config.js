import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/generated'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    },
  },
  {
    // Pruebas de integración: SIEMPRE contra MySQL real (base _test) con Supertest.
    // Prohibido simular Prisma o la base de datos (CLAUDE.md, sección Pruebas).
    files: ['tests/**/*.ts', 'src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*mock-extended*', 'prismock', '*prisma-mock*', '@quramy/prisma-fabbrica'],
              message: 'No se simula Prisma: usa la base de pruebas real y tests/helpers/db.ts.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock|unmock)$/]",
          message:
            'Sin vi.mock en el backend: la prueba va contra MySQL real con Supertest y tests/helpers/db.ts.',
        },
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='spyOn'] > Identifier[name='prisma']",
          message: 'No se espía ni se reemplaza prisma: usa datos reales en la base de pruebas.',
        },
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='spyOn'] > MemberExpression[object.name='prisma']",
          message: 'No se espía ni se reemplaza prisma: usa datos reales en la base de pruebas.',
        },
      ],
    },
  },
);
