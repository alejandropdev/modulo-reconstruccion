# Justificación tecnológica — Módulo de Reconstrucción

**Equipo:** Andres Doncel Martinez · Nicolas Angulo Forero · Alejandro Parrado Di Domenico · Diego Novoa Jimenez

## Criterios

1. Experiencia del equipo (25 %).
2. Soporte a la arquitectura limpia (25 %).
3. Escalabilidad y despliegue (20 %).
4. Tipado y corrección del dominio (15 %) y trabajo con MongoDB (15 %).

## Trade-offs

| Criterio | Java + Spring Boot 4 | .NET 10 (C#) | Node.js + TypeScript |
|---|---|---|---|
| Soporte a arquitectura limpia | Módulos Maven/Gradle; el compilador impide dependencias hacia afuera. ArchUnit. DI nativa. | Un `.csproj` por anillo; el compilador impide referencias hacia afuera. NetArchTest. DI nativa. | Workspaces (un paquete por anillo) + `dependency-cruiser`. Interfaces solo en compilación. NestJS da DI; sus decoradores no deben entrar al dominio. |
| Tipado y corrección del dominio | Nominal, `record`, `sealed`, `BigDecimal`. | Nominal, `record`, `decimal` nativo. | Estructural y solo en compilación; requiere validación en runtime (zod); `number` es flotante → value object en centavos. |
| Trabajo con MongoDB | Spring Data MongoDB, maduro; mapeo con anotaciones/mappers. | Driver oficial + proveedor EF Core para MongoDB. | Encaje natural JSON/BSON; driver oficial. |
| Escalabilidad y despliegue | Muy maduro; más memoria y arranque más lento (virtual threads, GraalVM). | Muy alto rendimiento; imágenes pequeñas; Native AOT. | Imágenes livianas; excelente en I/O (este módulo es CRUD + reglas); débil en CPU intensivo (no aplica). |
| Coherencia con el frontend | Dos lenguajes. | Dos lenguajes (salvo Blazor). | Un solo lenguaje; tipos/esquemas compartidos API ↔ web. |
| Experiencia del equipo | Baja | Baja | Alta |

## Puntaje

| Criterio (peso) | Java | .NET | Node + TS |
|---|---|---|---|
| Arquitectura limpia (25 %) | 5 | 5 | 4 |
| Tipado y dominio (15 %) | 5 | 5 | 3 |
| MongoDB (15 %) | 4 | 4 | 5 |
| Escalabilidad y despliegue (20 %) | 4 | 5 | 4 |
| Experiencia del equipo (25 %) | 2 | 2 | 5 |
| **Total** | **3,90** | **4,10** | **4,25** |
| **Total solo técnico** (sin experiencia, re-normalizado) | 4,53 | **4,80** | 4,00 |

## Decisión

Elegimos **Node.js 24 LTS + TypeScript** (NestJS, MongoDB, React). Técnicamente .NET 10 es la mejor opción y Java + Spring Boot queda muy cerca; pero al sumar la experiencia del equipo Node + TS obtiene el mayor puntaje, encaja de forma natural con MongoDB y permite un solo lenguaje con el frontend.

### Mitigaciones

| Debilidad | Mitigación en este plan |
|---|---|
| La regla de dependencias no la impone el compilador | Un paquete por anillo con `package.json` que solo declara las dependencias permitidas + `dependency-cruiser` en `pnpm verificar` |
| Tipos solo en compilación | Validación en runtime con zod en la frontera HTTP; constructores de entidades y value objects que validan invariantes |
| `number` flotante para dinero | Value object `Dinero` con centavos en `bigint` |
| Decoradores de NestJS contaminando el núcleo | NestJS solo en `apps/api`; interactores como clases puras registradas con `useFactory` |

## Tecnologías por anillo de la arquitectura limpia

| Anillo | Paquete |
|---|---|
| Entidades (reglas empresariales) | `packages/dominio` |
| Casos de uso (reglas de aplicación) | `packages/aplicacion` |
| Adaptadores de interfaz | `apps/api` (controladores, presentadores) y `packages/infraestructura` (gateways) |
| Frameworks y drivers | NestJS, driver de MongoDB, GridFS, React |

## Índice de ADRs

| ADR | Título | Decisión |
|---|---|---|
| [0000](adr/0000-registrar-decisiones-con-madr.md) | Registrar decisiones con MADR | MADR 4 |
| [0001](adr/0001-node-js-24-lts-typescript-como-plataforma.md) | Node.js 24 LTS + TypeScript como plataforma | Node.js 24 LTS + TypeScript (modo estricto) |
| [0002](adr/0002-nestjs-para-los-anillos-externos.md) | NestJS para los anillos externos | NestJS solo en `apps/api` y `apps/mock-modulos` |
| [0003](adr/0003-monorepo-pnpm-con-un-paquete-por-anillo.md) | Monorepo pnpm con un paquete por anillo | Monorepo pnpm con `packages/{dominio,aplicacion,infraestructura,contratos}` y `apps/{api,mock-modulos,web}` |
| [0004](adr/0004-mongodb-con-driver-oficial-y-mappers-explicitos.md) | MongoDB con driver oficial y mappers explícitos | MongoDB 8 con el driver oficial |
| [0005](adr/0005-unidad-de-trabajo-outbox-para-eventos.md) | Unidad de trabajo + outbox para eventos | Unidad de trabajo (transacción Mongo) + outbox |
| [0006](adr/0006-dinero-como-value-object-en-centavos.md) | Dinero como value object en centavos | `Dinero` en centavos (`bigint`); `Long` en Mongo; string decimal con hasta 2 decimales en la API |
| [0007](adr/0007-autenticacion-con-jwt-propio.md) | Autenticación con JWT propio | JWT HS256 propio con usuarios en Mongo |
| [0008](adr/0008-modulos-externos-via-http-servicio-mock.md) | Módulos externos vía HTTP + servicio mock | Adaptadores HTTP + servicio mock |
| [0009](adr/0009-evidencias-en-gridfs.md) | Evidencias en GridFS | GridFS, bucket `evidencias` |
| [0010](adr/0010-react-vite-con-contratos-zod-compartidos.md) | React + Vite con contratos zod compartidos | React + Vite + TypeScript con Mantine, TanStack Query y `@reconstruccion/contratos` |
| [0011](adr/0011-docker-compose-para-ejecucion.md) | Docker Compose para ejecución | Docker Compose con `mongo`, `mock-modulos`, `api` y `web` |
| [0012](adr/0012-reglas-de-negocio-complementarias-y-desviaciones-del-diseno.md) | Reglas de negocio complementarias y desviaciones del diseño | Adoptar las reglas C01–C17 y los puertos ★ |
| [0013](adr/0013-estrategia-de-pruebas.md) | Estrategia de pruebas | Vitest: unitarias (dominio y casos de uso, con fakes) + integración con `mongodb-memory-server` en replica set |
