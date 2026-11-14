---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0001: Node.js 24 LTS + TypeScript como plataforma

## Contexto y planteamiento del problema

Hay que asociar una tecnología al diseño del módulo de Reconstrucción (reglas de negocio sobre un agregado, CRUD, integración HTTP con otros módulos).

## Factores de decisión

* Experiencia del equipo (25 %)
* Soporte a la arquitectura limpia (25 %)
* Escalabilidad y despliegue (20 %)
* Tipado y corrección del dominio (15 %)
* Trabajo con MongoDB (15 %)

## Opciones consideradas

* Java 25 LTS + Spring Boot 4
* .NET 10 LTS (C#)
* Node.js 24 LTS + TypeScript

## Resultado de la decisión

Opción elegida: **Node.js 24 LTS + TypeScript (modo estricto)**, porque al ponderar la experiencia del equipo obtiene el mayor puntaje (4,25 frente a 4,10 de .NET y 3,90 de Java). Técnicamente .NET 10 es la mejor opción y Java + Spring Boot queda muy cerca; lo reconocemos y mitigamos las debilidades de Node.

### Consecuencias

* Bueno, porque menor tiempo de entrega y de revisión
* Bueno, porque un solo lenguaje y esquemas compartidos API ↔ web
* Malo, porque hay que hacer cumplir la arquitectura con herramientas (ver mitigaciones)
* Malo, porque validación en runtime obligatoria

### Confirmación

`pnpm verificar` ejecuta TypeScript estricto, ESLint y `dependency-cruiser`.

## Pros y contras de las opciones

### Java 25 LTS + Spring Boot 4

* Bueno, porque compilador impide dependencias hacia afuera; `BigDecimal`; ArchUnit
* Malo, porque el equipo tiene poca experiencia; más memoria y arranque lento

### .NET 10 LTS (C#)

* Bueno, porque un `.csproj` por anillo; `decimal` nativo; mejor puntaje técnico
* Malo, porque el equipo tiene poca experiencia; dos lenguajes con el frontend

### Node.js 24 LTS + TypeScript

* Bueno, porque experiencia alta; encaje natural con MongoDB; un solo lenguaje con el frontend
* Malo, porque la regla de dependencias no la impone el compilador; tipos solo en compilación; `number` es flotante

## Comparación

### Trade-offs (versiones vigentes en noviembre de 2026)

| Criterio | Java + Spring Boot 4 | .NET 10 (C#) | Node.js + TypeScript |
|---|---|---|---|
| Soporte a arquitectura limpia | Módulos Maven/Gradle; el compilador impide dependencias hacia afuera. ArchUnit. DI nativa. | Un `.csproj` por anillo; el compilador impide referencias hacia afuera. NetArchTest. DI nativa. | Workspaces (un paquete por anillo) + `dependency-cruiser`. Interfaces solo en compilación. NestJS da DI; sus decoradores no deben entrar al dominio. |
| Tipado y corrección del dominio | Nominal, `record`, `sealed`, `BigDecimal`. | Nominal, `record`, `decimal` nativo. | Estructural y solo en compilación; requiere validación en runtime (zod); `number` es flotante → value object en centavos. |
| Trabajo con MongoDB | Spring Data MongoDB, maduro; mapeo con anotaciones/mappers. | Driver oficial + proveedor EF Core para MongoDB. | Encaje natural JSON/BSON; driver oficial. |
| Escalabilidad y despliegue | Muy maduro; más memoria y arranque más lento (virtual threads, GraalVM). | Muy alto rendimiento; imágenes pequeñas; Native AOT. | Imágenes livianas; excelente en I/O (este módulo es CRUD + reglas); débil en CPU intensivo (no aplica). |
| Coherencia con el frontend | Dos lenguajes. | Dos lenguajes (salvo Blazor). | Un solo lenguaje; tipos/esquemas compartidos API ↔ web. |
| Experiencia del equipo | Baja | Baja | Alta |

### Puntaje ponderado (1–5)

| Criterio (peso) | Java | .NET | Node + TS |
|---|---|---|---|
| Arquitectura limpia (25 %) | 5 | 5 | 4 |
| Tipado y dominio (15 %) | 5 | 5 | 3 |
| MongoDB (15 %) | 4 | 4 | 5 |
| Escalabilidad y despliegue (20 %) | 4 | 5 | 4 |
| Experiencia del equipo (25 %) | 2 | 2 | 5 |
| **Total** | **3,90** | **4,10** | **4,25** |
| **Total solo técnico** (sin experiencia, re-normalizado) | 4,53 | **4,80** | 4,00 |

### Mitigaciones

| Debilidad | Mitigación en este plan |
|---|---|
| La regla de dependencias no la impone el compilador | Un paquete por anillo con `package.json` que solo declara las dependencias permitidas + `dependency-cruiser` en `pnpm verificar` |
| Tipos solo en compilación | Validación en runtime con zod en la frontera HTTP; constructores de entidades y value objects que validan invariantes |
| `number` flotante para dinero | Value object `Dinero` con centavos en `bigint` |
| Decoradores de NestJS contaminando el núcleo | NestJS solo en `apps/api`; interactores como clases puras registradas con `useFactory` |

## Información adicional

Nota de implementación: se usa TypeScript 6 porque `typescript-eslint` aún no soporta TypeScript 7.
