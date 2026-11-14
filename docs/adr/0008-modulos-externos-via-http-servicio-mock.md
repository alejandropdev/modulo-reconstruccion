---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0008: Módulos externos vía HTTP + servicio mock

## Contexto y planteamiento del problema

Desastres y evaluaciones de daños pertenecen a otros módulos que no existen aún.

## Factores de decisión

* Simular el contrato real
* Cambiar al módulo real sin tocar el núcleo

## Opciones consideradas

* Servicio mock HTTP (`apps/mock-modulos`)
* Colecciones semilla
* Stubs en memoria

## Resultado de la decisión

Opción elegida: **Adaptadores HTTP + servicio mock**, porque ejercita los adaptadores y el error `SERVICIO_EXTERNO_NO_DISPONIBLE`.

### Consecuencias

* Bueno, porque integración probada
* Malo, porque servicio adicional en Compose

### Confirmación

Pruebas de los clientes HTTP contra un servidor `node:http` local.

## Pros y contras de las opciones

### Servicio mock HTTP (`apps/mock-modulos`)

* Bueno, porque contrato real; cambiar es cambiar una URL
* Malo, porque un servicio más

### Colecciones semilla

* Bueno, porque sin servicio
* Malo, porque no simula fallas de red

### Stubs en memoria

* Bueno, porque simple
* Malo, porque no pasa por el adaptador HTTP

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
