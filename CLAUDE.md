# CLAUDE.md — Módulo de Reconstrucción (Taller: elección de tecnologías)

Este repositorio implementa el **módulo de Reconstrucción** de la plataforma de gestión de desastres, a partir del diseño de `taller_capa_negocio_reconstruccion.pdf` (capa de negocio) y de las decisiones de tecnología registradas en `PLAN.md`.

**Tu trabajo es ejecutar `PLAN.md` fase por fase.** Este archivo tiene las reglas permanentes; `PLAN.md` tiene el qué, el cómo y los criterios de aceptación.

## Cómo trabajar

1. Lee `PLAN.md` completo antes de empezar. Ubica la primera fase con tareas sin marcar (`- [ ]`) y continúa desde ahí.
2. Trabaja **una fase a la vez**, en orden. No adelantes trabajo de fases posteriores.
3. Al terminar cada fase:
   - Ejecuta `pnpm verificar` (lint + typecheck + reglas de arquitectura + pruebas). Todo debe pasar.
   - Revisa los criterios de aceptación de la fase uno por uno.
   - Marca las tareas como `- [x]` en `PLAN.md`.
   - Haz **un commit por fase** con el mensaje indicado en la fase (Conventional Commits en español).
4. Si algo no está cubierto por `PLAN.md` (sección "Supuestos y reglas complementarias" incluida), **detente y pregunta**. No inventes reglas de negocio.
5. No cambies una decisión de tecnología registrada en un ADR sin preguntar. Si una versión de librería no existe o falló, usa la versión estable más reciente y anótalo en el ADR correspondiente.

## Reglas de arquitectura (no negociables)

- **Arquitectura limpia:** las dependencias apuntan hacia adentro.
  - `packages/dominio` no importa **nada** externo: ni paquetes npm, ni `node:*`, ni otros paquetes del monorepo.
  - `packages/aplicacion` solo importa `@reconstruccion/dominio`.
  - `packages/infraestructura` implementa los puertos de salida; puede importar `dominio`, `aplicacion`, `mongodb` y librerías de I/O.
  - `apps/api` (NestJS) es el único lugar donde viven decoradores de NestJS, controladores, presentadores HTTP, guards y la composición (inyección de dependencias).
  - `apps/web` solo importa `@reconstruccion/contratos`; nunca `dominio`, `aplicacion` ni `infraestructura`.
  - `dependency-cruiser` hace cumplir estas reglas (`pnpm arq`). Si falla, corrige el código, nunca la regla.
- **Las reglas de negocio viven en las entidades y políticas de dominio.** Los interactores solo coordinan: autorizan, consultan otros módulos, cargan el agregado, piden a la entidad aplicar la regla, guardan, auditan y publican eventos.
- **Las partes del agregado** (`Presupuesto`, `CambioPresupuesto`, `Hito`, `RegistroAvance`, `Costo`, `Evidencia`, `CambioEstado`, `ReferenciaEvaluacion`) solo se modifican a través de `ProyectoReconstruccion`. No expongas setters ni arreglos mutables; devuelve copias de solo lectura.
- **Historial inmutable:** el historial de estados, de cambios de presupuesto y de avances solo crece. Nunca se borra ni se sobrescribe un registro aplicado.
- **Dinero:** siempre con el value object `Dinero` (centavos en `bigint`). Prohibido usar `number` para montos.
- **Tiempo:** nunca `new Date()` ni `Date.now()` en `dominio` o `aplicacion`. La hora llega por el puerto `Reloj` y se pasa como parámetro a la entidad. Zona horaria del negocio: `America/Bogota`.
- **Identificadores:** se generan con el puerto `GeneradorIds` (UUID v4 en infraestructura).

## Convenciones de código

- Idioma: **español** para todo el código del negocio y de la API (clases, métodos, variables, rutas, mensajes de error), siguiendo el lenguaje ubicuo del diseño (`ProyectoReconstruccion`, `solicitarCambioPresupuesto`, `/proyectos/:id/avances`). Sin tildes ni ñ en identificadores (`Dano`, `Reconstruccion`, `Contrasena`); con tildes en textos para el usuario.
- TypeScript en modo `strict` (incluye `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`). Prohibido `any`; usa `unknown` y estrecha el tipo.
- Un archivo por clase/tipo principal. Nombres de archivo en `PascalCase.ts` para clases y `camelCase.ts` para utilidades.
- Errores de negocio: subclases de `ErrorDominio` con un `codigo` del catálogo de `PLAN.md`. Nada de `throw new Error('...')` en dominio o aplicación.
- Validación de entrada HTTP con los esquemas zod de `@reconstruccion/contratos`.
- Formato con Prettier y lint con ESLint; no desactives reglas con comentarios salvo justificación escrita en la misma línea.

## Comandos

```bash
pnpm install            # instala el monorepo
pnpm verificar          # lint + typecheck + arq + test (obligatorio antes de cada commit)
pnpm test               # pruebas unitarias y de integración (Vitest)
pnpm arq                # reglas de dependencias (dependency-cruiser)
pnpm dev                # api + mock-modulos + web en modo desarrollo (requiere Mongo en replica set)
docker compose up --build   # todo el sistema
```

## Pruebas

- Cada regla de negocio (R01–R17 y C01–C15 en `PLAN.md`) debe tener al menos una prueba que la verifique; el nombre de la prueba empieza por su código, p. ej. `it('R14: el avance no puede bajar', ...)`.
- Dominio y aplicación: pruebas unitarias con puertos falsos en memoria. Nada de Mongo ni red.
- Infraestructura: pruebas de integración contra `mongodb-memory-server` en modo replica set.

## Git

- Repositorio en la raíz de esta carpeta. Rama `main`.
- Commits pequeños por fase, en español: `feat(dominio): ...`, `test(aplicacion): ...`, `docs(adr): ...`, `chore: ...`.
- No subas `.env`, `node_modules`, `dist` ni `coverage`.
