---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0006: Dinero como value object en centavos

## Contexto y planteamiento del problema

`number` es de coma flotante y no sirve para montos.

## Factores de decisión

* Exactitud
* Dominio sin dependencias

## Opciones consideradas

* `Dinero` en centavos con `bigint`
* decimal.js + Decimal128

## Resultado de la decisión

Opción elegida: **`Dinero` en centavos (`bigint`); `Long` en Mongo; string decimal con hasta 2 decimales en la API**, porque es exacto y respeta que el dominio no tenga dependencias.

### Consecuencias

* Bueno, porque aritmética exacta
* Malo, porque `bigint` no se serializa a JSON directamente

### Confirmación

Pruebas unitarias de `Dinero`; ESLint y revisión: ningún monto usa `number`.

## Pros y contras de las opciones

### `Dinero` en centavos con `bigint`

* Bueno, porque exacto; sin dependencias
* Malo, porque hay que convertir a texto en los bordes

### decimal.js + Decimal128

* Bueno, porque decimales arbitrarios
* Malo, porque dependencia en el dominio

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
