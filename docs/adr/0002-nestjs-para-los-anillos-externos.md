---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0002: NestJS para los anillos externos

## Contexto y planteamiento del problema

El anillo de adaptadores necesita controladores, guards, validación y una forma de enlazar puertos con adaptadores.

## Factores de decisión

* Inyección de dependencias y módulos nativos
* Mantener el núcleo libre de framework
* Swagger y validación

## Opciones consideradas

* NestJS
* Express
* Fastify

## Resultado de la decisión

Opción elegida: **NestJS solo en `apps/api` y `apps/mock-modulos`**, porque la DI enlaza puertos con adaptadores sin tocar el dominio.

### Consecuencias

* Bueno, porque composición clara con tokens y `useFactory`
* Malo, porque un framework más que aprender

### Confirmación

Ningún paquete bajo `packages/` importa `@nestjs/*` (regla de `dependency-cruiser`).

## Pros y contras de las opciones

### NestJS

* Bueno, porque dI y módulos nativos; Swagger; `nestjs-zod`
* Malo, porque decoradores: deben quedar fuera del núcleo

### Express

* Bueno, porque mínimo y conocido
* Malo, porque la composición y la DI se hacen a mano

### Fastify

* Bueno, porque rápido
* Malo, porque misma carencia de DI que Express

## Información adicional

Los interactores son clases puras registradas con `useFactory`, sin `@Injectable`.
