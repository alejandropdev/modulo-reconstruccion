---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0000: Registrar decisiones con MADR

## Contexto y planteamiento del problema

El equipo (cuatro integrantes) toma decisiones de tecnología y arquitectura que deben quedar justificadas para el taller y consultables después.

## Factores de decisión

* Formato estándar y liviano
* Versionado junto al código
* Facilidad para revisar en PRs

## Opciones consideradas

* MADR 4
* Formato de Nygard
* Sin ADRs

## Resultado de la decisión

Opción elegida: **MADR 4**, porque obliga a documentar opciones y consecuencias, que es lo que pide el taller.

### Consecuencias

* Bueno, porque decisiones trazables y revisables en PR
* Malo, porque hay que mantener los ADRs al día

### Confirmación

Cada decisión D1–D14 de `PLAN.md` está cubierta por un ADR en `docs/adr/`.

## Pros y contras de las opciones

### MADR 4

* Bueno, porque estándar en Markdown, plantilla clara con opciones y consecuencias
* Malo, porque más secciones que el formato mínimo

### Formato de Nygard

* Bueno, porque muy corto
* Malo, porque no obliga a comparar opciones

### Sin ADRs

* Bueno, porque cero esfuerzo
* Malo, porque las decisiones se pierden; no cumple el taller

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
