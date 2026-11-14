---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0007: Autenticación con JWT propio

## Contexto y planteamiento del problema

Los casos de uso dependen del usuario y su rol (AUTORIDAD, APROBADOR, RESPONSABLE); R07 y C03 exigen distinguir personas.

## Factores de decisión

* Autenticación real con bajo costo operativo
* Los roles se validan en los casos de uso

## Opciones consideradas

* JWT propio (login con hash argon2id)
* Usuarios simulados
* Keycloak

## Resultado de la decisión

Opción elegida: **JWT HS256 propio con usuarios en Mongo**, porque identidad real sin operar un proveedor.

### Consecuencias

* Bueno, porque simple de ejecutar
* Malo, porque no es un IdP completo (sin refresco ni recuperación)

### Confirmación

Un guard global exige el token; los interactores prueban `NO_AUTORIZADO`.

## Pros y contras de las opciones

### JWT propio (login con hash argon2id)

* Bueno, porque sin servicios extra; identidad real
* Malo, porque gestión de usuarios mínima, propia

### Usuarios simulados

* Bueno, porque cero esfuerzo
* Malo, porque no demuestra identidad real

### Keycloak

* Bueno, porque estándar
* Malo, porque servicio pesado para un taller

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
