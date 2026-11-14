---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0010: React + Vite con contratos zod compartidos

## Contexto y planteamiento del problema

Tres actores necesitan una interfaz web.

## Factores de decisión

* SPA liviana
* Reutilizar validaciones
* Un solo lenguaje

## Opciones consideradas

* React + Vite
* Angular
* Next.js

## Resultado de la decisión

Opción elegida: **React + Vite + TypeScript con Mantine, TanStack Query y `@reconstruccion/contratos`**, porque mismos esquemas de validación en API y web.

### Consecuencias

* Bueno, porque validación coherente
* Malo, porque dependencia de `contratos`

### Confirmación

`dependency-cruiser`: `apps/web` solo importa `contratos`.

## Pros y contras de las opciones

### React + Vite

* Bueno, porque liviano; zod compartido
* Malo, porque sin SSR (no se necesita)

### Angular

* Bueno, porque completo
* Malo, porque más pesado; el equipo conoce menos

### Next.js

* Bueno, porque sSR
* Malo, porque innecesario aquí

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
