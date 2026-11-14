# Registro de decisiones de arquitectura (MADR)

| ADR | Título | Decisión |
|---|---|---|
| [0000](0000-registrar-decisiones-con-madr.md) | Registrar decisiones con MADR | MADR 4 |
| [0001](0001-node-js-24-lts-typescript-como-plataforma.md) | Node.js 24 LTS + TypeScript como plataforma | Node.js 24 LTS + TypeScript (modo estricto) |
| [0002](0002-nestjs-para-los-anillos-externos.md) | NestJS para los anillos externos | NestJS solo en `apps/api` y `apps/mock-modulos` |
| [0003](0003-monorepo-pnpm-con-un-paquete-por-anillo.md) | Monorepo pnpm con un paquete por anillo | Monorepo pnpm con `packages/{dominio,aplicacion,infraestructura,contratos}` y `apps/{api,mock-modulos,web}` |
| [0004](0004-mongodb-con-driver-oficial-y-mappers-explicitos.md) | MongoDB con driver oficial y mappers explícitos | MongoDB 8 con el driver oficial |
| [0005](0005-unidad-de-trabajo-outbox-para-eventos.md) | Unidad de trabajo + outbox para eventos | Unidad de trabajo (transacción Mongo) + outbox |
| [0006](0006-dinero-como-value-object-en-centavos.md) | Dinero como value object en centavos | `Dinero` en centavos (`bigint`); `Long` en Mongo; string decimal con hasta 2 decimales en la API |
| [0007](0007-autenticacion-con-jwt-propio.md) | Autenticación con JWT propio | JWT HS256 propio con usuarios en Mongo |
| [0008](0008-modulos-externos-via-http-servicio-mock.md) | Módulos externos vía HTTP + servicio mock | Adaptadores HTTP + servicio mock |
| [0009](0009-evidencias-en-gridfs.md) | Evidencias en GridFS | GridFS, bucket `evidencias` |
| [0010](0010-react-vite-con-contratos-zod-compartidos.md) | React + Vite con contratos zod compartidos | React + Vite + TypeScript con Mantine, TanStack Query y `@reconstruccion/contratos` |
| [0011](0011-docker-compose-para-ejecucion.md) | Docker Compose para ejecución | Docker Compose con `mongo`, `mock-modulos`, `api` y `web` |
| [0012](0012-reglas-de-negocio-complementarias-y-desviaciones-del-diseno.md) | Reglas de negocio complementarias y desviaciones del diseño | Adoptar las reglas C01–C17 y los puertos ★ |
| [0013](0013-estrategia-de-pruebas.md) | Estrategia de pruebas | Vitest: unitarias (dominio y casos de uso, con fakes) + integración con `mongodb-memory-server` en replica set |
