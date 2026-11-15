# Módulo de Reconstrucción

Taller de Arquitectura de Software 2026-30 (Pontificia Universidad Javeriana). Implementa el módulo de Reconstrucción de la plataforma de gestión de desastres con arquitectura limpia.

**Equipo:** Andres Doncel Martinez · Nicolas Angulo Forero · Alejandro Parrado Di Domenico · Diego Novoa Jimenez

## Documentación

- [Justificación tecnológica](docs/justificacion-tecnologica.md) y [ADRs (MADR)](docs/adr/README.md)
- [Plan de implementación](PLAN.md) · [Guion de demostración](docs/guion-demo.md)

## Cómo ejecutar

### Con Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

La web queda en <http://localhost:8080>, la API en <http://localhost:3000/api/v1> (Swagger en `/api/docs`) y el mock de otros módulos en el puerto 3001.

### Sin Docker (desarrollo)

Requiere Node 24 y pnpm, y un MongoDB en replica set `rs0` en `localhost:27017`.

```bash
pnpm install
export MONGO_URI='mongodb://localhost:27017/reconstruccion?replicaSet=rs0' JWT_SECRET=secreto-de-desarrollo
pnpm --filter api seed
pnpm dev            # api (3000) + mock-modulos (3001) + web (5173)
```

`pnpm verificar` ejecuta lint, typecheck, reglas de arquitectura y pruebas (las de integración usan `mongodb-memory-server`, sin Docker).

## Estado de la verificación

- `pnpm verificar` (lint, typecheck, arquitectura y 226 pruebas) en verde.
- `docker compose up --build` y el recorrido completo por HTTP verificados.
- Recorrido de la web en el navegador verificado manualmente con el guion de [docs/guion-demo.md](docs/guion-demo.md).

## Usuarios de prueba (contraseña `Clave123*`)

| Id | Correo | Roles |
|---|---|---|
| u-autoridad | autoridad@reconstruccion.dev | AUTORIDAD |
| u-aprobador1 | aprobador1@reconstruccion.dev | APROBADOR |
| u-aprobador2 | aprobador2@reconstruccion.dev | APROBADOR |
| u-responsable1 | responsable1@reconstruccion.dev | RESPONSABLE |
| u-responsable2 | responsable2@reconstruccion.dev | RESPONSABLE |
| u-autoridad-aprobadora | autoridad.aprobadora@reconstruccion.dev | AUTORIDAD, APROBADOR |

Datos del mock: D-001 (Caracterización), D-002 (Reconstrucción, evaluaciones E-21…E-26), D-003 (Registro), D-004 (Caracterización sin evaluaciones que requieran intervención).

## Mapa de carpetas ↔ anillos de la arquitectura limpia

| Anillo | Carpeta |
|---|---|
| Entidades (reglas empresariales) | `packages/dominio` |
| Casos de uso (reglas de aplicación) | `packages/aplicacion` |
| Adaptadores de interfaz | `apps/api` (controladores, presentadores) y `packages/infraestructura` (gateways) |
| Frameworks y drivers | NestJS, driver de MongoDB, GridFS, React (`apps/web`) |
| Contratos compartidos API ↔ web | `packages/contratos` |
| Otros módulos simulados | `apps/mock-modulos` |

Las dependencias apuntan hacia adentro y se verifican con `pnpm arq` (dependency-cruiser).
