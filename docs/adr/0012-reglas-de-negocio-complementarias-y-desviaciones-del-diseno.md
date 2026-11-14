---
status: aceptado
date: 2026-11-14
decision-makers: Andres Doncel Martinez, Nicolas Angulo Forero, Alejandro Parrado Di Domenico, Diego Novoa Jimenez
---

# ADR-0012: Reglas de negocio complementarias y desviaciones del diseño

## Contexto y planteamiento del problema

El diseño deja ambigüedades y no cubre los casos de uso del desastre ni los archivos de evidencia.

## Factores de decisión

* No inventar reglas sin acuerdo
* Trazabilidad

## Opciones consideradas

* Documentar C01–C17 y los puertos agregados aquí
* Dejar las ambigüedades abiertas

## Resultado de la decisión

Opción elegida: **Adoptar las reglas C01–C17 y los puertos ★**, porque cierra las ambigüedades y deja cada desviación justificada.

### Consecuencias

* Bueno, porque cada regla tiene prueba
* Malo, porque más superficie que el diseño original

### Confirmación

`docs/trazabilidad.md` (Fase 9) enlaza cada regla con sus pruebas.

## Pros y contras de las opciones

### Documentar C01–C17 y los puertos agregados aquí

* Bueno, porque decisiones explícitas y revisables
* Malo, porque se desvía del diseño original

### Dejar las ambigüedades abiertas

* Bueno, porque sin trabajo
* Malo, porque implementación inconsistente

## Reglas complementarias

| Código | Regla complementaria | Dónde |
|---|---|---|
| C01 | **Umbral absoluto:** un cambio de presupuesto requiere aprobación si `|valorNuevo − valorVigente| > umbral`. El umbral es un monto en pesos configurable (`ParametrosNegocio`, por defecto $50.000.000). Si no lo supera, se **aplica de inmediato** (estado `Aplicado`). | `PoliticaAprobacionPresupuesto` |
| C02 | El nuevo presupuesto **no puede ser menor que los costos ejecutados**; se valida al solicitar y otra vez al aprobar. El nuevo valor debe ser > 0. | Agregado |
| C03 | Quien **resuelve** un cambio de presupuesto debe ser **distinto de quien lo solicitó**. | `resolverCambioPresupuesto` |
| C04 | Un proyecto **Suspendido, Finalizado o Cancelado** no acepta solicitudes ni resoluciones de cambio de presupuesto. | Agregado |
| C05 | **Tipo de intervención según nivel de daño:** se toma el **mayor** `nivelDano` de las evaluaciones referenciadas; tipos permitidos: `LEVE → {REPARACION}`, `MODERADO → {REHABILITACION, REFORZAMIENTO}`, `SEVERO → {RECONSTRUCCION}`, `TOTAL → {RECONSTRUCCION, REUBICACION}`. Orden: LEVE < MODERADO < SEVERO < TOTAL. | `PoliticaTipoIntervencion` |
| C06 | Para crear un proyecto el desastre debe estar en **RECONSTRUCCION**, y todas sus evaluaciones deben pertenecer a ese desastre, estar **VALIDADAS** y con `requiereIntervencion = true`. Las evaluaciones no se repiten dentro del proyecto. | `CrearProyecto` + `crear` |
| C07 | **Creación masiva parcial:** lista de hasta 100 proyectos; cada uno se procesa en su propia transacción y en orden; se crean los válidos y se devuelve un reporte por ítem (`indice`, `exito`, `proyectoId` o `errores[]`). Dos ítems con la misma evaluación: el segundo falla por R05. En la web se sube un CSV que el navegador convierte a JSON. | `CrearProyectosMasivo` |
| C08 | **Hitos:** los define el Responsable. En Formulado/Aprobado se pueden agregar, editar y eliminar. En EnEjecucion solo se registra `fechaReal` (no se cambia `fechaPlanificada` ni se eliminan). En Suspendido o estados finales no se modifican. | `ActualizarHito` + agregado |
| C09 | **Evidencias:** solo en EnEjecucion; tipos `ENTREGA`, `AVANCE`, `FOTOGRAFICA`, `DOCUMENTO`; archivos PDF, JPG o PNG de hasta 10 MB. | `AdjuntarEvidencia` + agregado |
| C10 | Las operaciones del Responsable (iniciar, avance, costo, cambio de presupuesto, suspender, reanudar, finalizar, hitos, evidencias) solo las puede hacer **el responsable asignado al proyecto**. | Agregado (`verificarResponsable`) + rol en interactor |
| C11 | Los **costos** solo se registran en EnEjecucion, con valor > 0 y concepto no vacío. | `registrarCosto` |
| C12 | Se permiten varios cambios pendientes, pero al **aprobar** uno se verifica que `valorVigente` no haya cambiado desde la solicitud (`valorAnterior`); si cambió, error `CAMBIO_DESACTUALIZADO` y debe solicitarse de nuevo. | `resolverCambioPresupuesto` |
| C13 | **Finalizar** exige que no haya cambios de presupuesto pendientes. **Cancelar** pasa los pendientes a `Anulado` con motivo "Proyecto cancelado". | Agregado |
| C14 | Suspender, reanudar y cancelar exigen **motivo** no vacío. | Agregado |
| C15 | Cerrar desastre: el desastre debe estar en RECONSTRUCCION y todos sus proyectos en Finalizado o Cancelado (lectura literal: si no tiene proyectos, se puede cerrar). | `PoliticaCicloDesastre` |
| C16 | `contratista { nit, nombre }` se puede registrar al crear o al iniciar la ejecución (entrada opcional de `IniciarEjecucion`). | `iniciarEjecucion(contratista?)` |
| C17 | Un proyecto es **activo** si está en Formulado, Aprobado, EnEjecucion o Suspendido. Al finalizar o cancelar se libera su evaluación (`activo = false`). | Agregado + documento Mongo |

## Puertos agregados (desviaciones del diseño)

| Puerto | Métodos | Adaptador |
|---|---|---|
| ★`ActualizacionEstadoDesastre` | `cambiarEstado(desastreId, nuevoEstado)` | `ActualizacionEstadoDesastreHttp` |
| ★`UnidadDeTrabajo` | `ejecutar<T>(trabajo: () => Promise<T>): Promise<T>` | `UnidadDeTrabajoMongo` (sesión + transacción en `AsyncLocalStorage`) |
| ★`AlmacenEvidencias` | `guardar(contenido, metadatos) → archivoId`, `abrir(archivoId)`, `eliminar(archivoId)` | `AlmacenEvidenciasGridFS` |
| ★`GeneradorIds` | `nuevo(): string` | `GeneradorIdsUuid` |

- Los de desastres existen porque se decidió implementar sus casos de uso.
- `UnidadDeTrabajo` garantiza la atomicidad de guardar, auditar y publicar.
- `AlmacenEvidencias` existe porque las evidencias son archivos.
- `GeneradorIds` mantiene el dominio puro.

## Información adicional

Ver `PLAN.md` y `docs/justificacion-tecnologica.md`.
