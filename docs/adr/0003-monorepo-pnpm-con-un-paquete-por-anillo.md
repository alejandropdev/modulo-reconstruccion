---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0003: Monorepo pnpm con un paquete por anillo

## Contexto y planteamiento del problema

La regla de dependencias de la arquitectura limpia no la impone el compilador en TypeScript.

## Factores de decisión

* Hacer explícita la regla de dependencias
* Simplicidad de operación
* Compartir contratos con el frontend

## Opciones consideradas

* Monorepo pnpm, un paquete por anillo
* Back y front en repos separados
* Proyecto único con carpetas

## Resultado de la decisión

Opción elegida: **Monorepo pnpm con `packages/{dominio,aplicacion,infraestructura,contratos}` y `apps/{api,mock-modulos,web}`**, porque la regla de dependencias queda escrita en cada `package.json` y se comprueba automáticamente.

### Consecuencias

* Bueno, porque violaciones detectadas en `pnpm arq`
* Malo, porque más configuración inicial

### Confirmación

`pnpm arq` falla si `dominio` importa `mongodb` (probado en la Fase 0).

## Pros y contras de las opciones

### Monorepo pnpm, un paquete por anillo

* Bueno, porque cada `package.json` declara solo lo permitido; se verifica con `dependency-cruiser`
* Malo, porque más archivos de configuración

### Back y front en repos separados

* Bueno, porque independencia
* Malo, porque contratos duplicados

### Proyecto único con carpetas

* Bueno, porque mínimo
* Malo, porque nada impide importar hacia afuera

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
