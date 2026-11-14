---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0005: Unidad de trabajo + outbox para eventos

## Contexto y planteamiento del problema

Un caso de uso guarda el agregado, registra la auditoría y publica eventos; los tres deben ocurrir juntos o ninguno.

## Factores de decisión

* Atomicidad
* No operar un broker
* Poder migrar a un broker después

## Opciones consideradas

* Unidad de trabajo + outbox en Mongo + bus en proceso
* RabbitMQ
* Kafka
* Bus en memoria

## Resultado de la decisión

Opción elegida: **Unidad de trabajo (transacción Mongo) + outbox**, porque cumple la atomicidad sin broker y deja el puerto `PublicadorEventosDominio` listo para migrar.

### Consecuencias

* Bueno, porque eventos nunca se pierden
* Malo, porque entrega al menos una vez; los suscriptores deben tolerar repetidos

### Confirmación

Prueba de integración: la transacción revierte agregado + auditoría + outbox juntos.

## Pros y contras de las opciones

### Unidad de trabajo + outbox en Mongo + bus en proceso

* Bueno, porque atomicidad con una transacción; sin infraestructura extra
* Malo, porque el despachador es propio, entrega al menos una vez

### RabbitMQ

* Bueno, porque broker real
* Malo, porque otro servicio que operar

### Kafka

* Bueno, porque escala
* Malo, porque excesivo para el taller

### Bus en memoria

* Bueno, porque simple
* Malo, porque se pierden eventos si el proceso cae

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
