---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0009: Evidencias en GridFS

## Contexto y planteamiento del problema

Las evidencias son archivos PDF, JPG o PNG de hasta 10 MB.

## Factores de decisión

* Archivos reales
* No agregar otro servicio

## Opciones consideradas

* MongoDB GridFS
* Solo metadatos + URL
* MinIO

## Resultado de la decisión

Opción elegida: **GridFS, bucket `evidencias`**, porque archivos reales sin otro servicio.

### Consecuencias

* Bueno, porque un solo almacén de datos
* Malo, porque la compensación (borrar el archivo) es manual si falla la transacción

### Confirmación

Prueba de integración de guardar/abrir/eliminar.

## Pros y contras de las opciones

### MongoDB GridFS

* Bueno, porque ya tenemos Mongo
* Malo, porque no es un almacén de objetos

### Solo metadatos + URL

* Bueno, porque muy simple
* Malo, porque no hay archivos reales

### MinIO

* Bueno, porque almacén de objetos
* Malo, porque otro servicio

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
