---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0011: Docker Compose para ejecución

## Contexto y planteamiento del problema

Las transacciones de Mongo exigen replica set; el sistema tiene cuatro procesos.

## Factores de decisión

* Un comando para levantar todo
* Replica set

## Opciones consideradas

* Docker Compose
* Local sin Docker
* Compose + CI

## Resultado de la decisión

Opción elegida: **Docker Compose con `mongo`, `mock-modulos`, `api` y `web`**, porque levanta todo, incluido el replica set `rs0`.

### Consecuencias

* Bueno, porque demo reproducible
* Malo, porque requiere Docker

### Confirmación

`docker compose up --build` deja la web en `http://localhost:8080`.

## Pros y contras de las opciones

### Docker Compose

* Bueno, porque un comando; Mongo en replica set
* Malo, porque requiere Docker

### Local sin Docker

* Bueno, porque sin Docker
* Malo, porque replica set manual

### Compose + CI

* Bueno, porque automatiza
* Malo, porque más de lo necesario

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
