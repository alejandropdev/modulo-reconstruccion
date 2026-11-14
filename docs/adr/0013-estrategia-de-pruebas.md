---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0013: Estrategia de pruebas

## Contexto y planteamiento del problema

Las reglas viven en dominio y aplicación; la persistencia depende de transacciones, índices y GridFS.

## Factores de decisión

* Velocidad
* Cubrir cada regla R/C
* Validar Mongo de verdad

## Opciones consideradas

* Unitarias + integración con Mongo
* + E2E de la API
* + E2E de la web

## Resultado de la decisión

Opción elegida: **Vitest: unitarias (dominio y casos de uso, con fakes) + integración con `mongodb-memory-server` en replica set**, porque cubre las reglas sin Docker.

### Consecuencias

* Bueno, porque `pnpm test` corre todo sin Docker
* Malo, porque la web y la API HTTP se verifican manualmente (guion de demo)

### Confirmación

Cobertura: dominio ≥ 90 %, aplicación ≥ 85 %; cada prueba de regla empieza por su código (`R14: ...`).

## Pros y contras de las opciones

### Unitarias + integración con Mongo

* Bueno, porque rápidas donde importa; Mongo real donde importa
* Malo, porque sin pruebas de extremo a extremo

### + E2E de la API

* Bueno, porque más confianza
* Malo, porque más lentas y frágiles

### + E2E de la web

* Bueno, porque cubre la interfaz
* Malo, porque costo alto para un taller

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
