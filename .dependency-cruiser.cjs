/** Reglas de dependencias de la arquitectura limpia (PLAN.md sección 4.2). */

module.exports = {
  forbidden: [
    { name: 'sin-circulares', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'dominio-sin-dependencias',
      severity: 'error',
      comment: 'dominio no importa npm, node:* ni otros paquetes',
      from: { path: '^packages/dominio/src' },
      to: { pathNot: '^packages/dominio/src' },
    },
    {
      name: 'dominio-sin-npm-ni-node',
      severity: 'error',
      from: { path: '^packages/dominio/src' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-peer', 'npm-optional', 'core', 'unknown', 'undetermined'] },
    },
    {
      name: 'aplicacion-solo-dominio',
      severity: 'error',
      from: { path: '^packages/aplicacion/src' },
      to: {
        pathNot: '^packages/(aplicacion/src|dominio/src)',
      },
    },
    {
      name: 'aplicacion-sin-npm-ni-node',
      severity: 'error',
      from: { path: '^packages/aplicacion/src' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-peer', 'npm-optional', 'core', 'unknown'] },
    },
    {
      name: 'contratos-solo-zod',
      severity: 'error',
      from: { path: '^packages/contratos/src' },
      to: { pathNot: ['^packages/contratos/src', 'node_modules/zod'] },
    },
    {
      name: 'web-solo-contratos',
      severity: 'error',
      from: { path: '^apps/web/src' },
      to: { path: '^packages/(dominio|aplicacion|infraestructura)/' },
    },
    {
      name: 'infraestructura-no-hacia-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'api-sin-web-ni-mock',
      severity: 'error',
      from: { path: '^apps/api/' },
      to: { path: '^apps/(web|mock-modulos)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
    tsPreCompilationDeps: true,
    exclude: { path: '(^|/)(test|dist|coverage)/|\\.test\\.tsx?$|vitest\\.config' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'], mainFields: ['main', 'types'] },
  },
};
