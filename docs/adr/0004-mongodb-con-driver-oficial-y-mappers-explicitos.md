---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0004: MongoDB con driver oficial y mappers explícitos

## Contexto y planteamiento del problema

El agregado `ProyectoReconstruccion` contiene historiales, hitos, costos y evidencias que se leen y escriben juntos.

## Factores de decisión

* Un documento por agregado
* Aislar el dominio de la persistencia
* Control de transacciones e índices

## Opciones consideradas

* Driver oficial + mappers
* Mongoose
* Prisma

## Resultado de la decisión

Opción elegida: **MongoDB 8 con el driver oficial**, porque un mapper por agregado mantiene el dominio puro y permite concurrencia optimista con `version`.

### Consecuencias

* Bueno, porque lecturas y escrituras atómicas por agregado
* Malo, porque mappers a mano

### Confirmación

Pruebas de integración con `mongodb-memory-server` en replica set (ida y vuelta del agregado, conflicto de versión, índice único de R05).

## Pros y contras de las opciones

### Driver oficial + mappers

* Bueno, porque el agregado se guarda como un documento; el dominio no conoce Mongo; control total
* Malo, porque hay que escribir los mappers

### Mongoose

* Bueno, porque esquemas y validación
* Malo, porque los modelos tienden a contaminar el dominio

### Prisma

* Bueno, porque tipado generado
* Malo, porque soporte de MongoDB limitado y exige replica set igual

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
