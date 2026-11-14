# Plan de implementación — Módulo de Reconstrucción

**Curso:** Arquitectura de Software 2026-30 — Pontificia Universidad Javeriana
**Equipo:** Andres Doncel Martinez · Nicolas Angulo Forero · Alejandro Parrado Di Domenico · Diego Novoa Jimenez
**Insumos:** `taller_capa_negocio_reconstruccion.pdf` (diseño de la capa de negocio) e imagen de instrucciones del taller.

## 0. Objetivo y entregables del taller

El taller pide:

1. **Asociar tecnología** al diseño del módulo de Reconstrucción (Java + Spring Boot, .NET o Angular/React/Node.js…).
2. **Justificar las decisiones.** → ADRs en formato **MADR** dentro de `docs/adr/` y un resumen en `docs/justificacion-tecnologica.md` (Fase 1).
3. **Implementar según la elección.** → Fases 2 a 9.

### Resumen de decisiones

| # | Decisión | Elección |
|---|---|---|
| D1 | Plataforma backend | **Node.js 24 LTS + TypeScript** (modo estricto) |
| D2 | Framework de los anillos externos | **NestJS** (solo en `apps/api`); dominio y aplicación en TypeScript puro |
| D3 | Organización del código | **Monorepo pnpm** con un paquete por anillo + `dependency-cruiser` |
| D4 | Persistencia | **MongoDB 8** con **driver oficial** y mappers explícitos; un documento por agregado; concurrencia optimista |
| D5 | Consistencia y eventos | **Unidad de trabajo** (transacción Mongo) + **outbox** en Mongo + bus de eventos en proceso |
| D6 | Dinero | Value object **`Dinero` en centavos (`bigint`)**; `Long` en Mongo; string decimal en la API |
| D7 | Autenticación y autorización | **JWT propio** (login usuario/contraseña con hash); autorización por rol en los casos de uso |
| D8 | Módulos externos (desastres, evaluaciones) | **Adaptadores HTTP** contra un **servicio mock** aparte (`apps/mock-modulos`) |
| D9 | Evidencias | Archivos en **MongoDB GridFS** |
| D10 | Frontend | **React + Vite + TypeScript**, contratos compartidos con zod |
| D11 | Ejecución | **Docker Compose** (Mongo replica set, API, mock, web) |
| D12 | Pruebas | **Unitarias** (dominio y casos de uso) + **integración con MongoDB** (Vitest) |
| D13 | Reglas complementarias | Umbral absoluto, política de tipo de intervención por nivel de daño, casos de uso del desastre, creación masiva parcial y reglas extra de presupuesto (sección 3) |
| D14 | Idioma del código | **Español**, mismo lenguaje ubicuo del diseño |

---

## 1. Justificación tecnológica (contenido para los ADRs)

### 1.1 Criterios del equipo

1. Experiencia del equipo (velocidad de entrega y de revisión de código).
2. Soporte a la arquitectura limpia (hacer cumplir la regla de dependencias, puertos e inyección de dependencias).
3. Tipado y versatilidad para trabajar con bases de datos no relacionales como MongoDB.
4. Escalabilidad y despliegue.

### 1.2 Tabla de trade-offs (versiones vigentes en noviembre de 2026)

Opciones: **Java 25 LTS + Spring Boot 4**, **.NET 10 LTS** (soporte hasta noviembre de 2028; .NET 8 y 9 terminan soporte el 10-nov-2026) y **Node.js 24 LTS + TypeScript**.

| Criterio | Java + Spring Boot 4 | .NET 10 (C#) | Node.js + TypeScript |
|---|---|---|---|
| Soporte a arquitectura limpia | Módulos Maven/Gradle; el compilador impide dependencias hacia afuera. ArchUnit. DI nativa. | Un `.csproj` por anillo; el compilador impide referencias hacia afuera. NetArchTest. DI nativa. | Workspaces (un paquete por anillo) + `dependency-cruiser`. Interfaces solo en compilación. NestJS da DI; sus decoradores no deben entrar al dominio. |
| Tipado y corrección del dominio | Nominal, `record`, `sealed`, `BigDecimal`. | Nominal, `record`, `decimal` nativo. | Estructural y solo en compilación; requiere validación en runtime (zod); `number` es flotante → value object en centavos. |
| Trabajo con MongoDB | Spring Data MongoDB, maduro; mapeo con anotaciones/mappers. | Driver oficial + proveedor EF Core para MongoDB. | Encaje natural JSON/BSON; driver oficial. |
| Escalabilidad y despliegue | Muy maduro; más memoria y arranque más lento (virtual threads, GraalVM). | Muy alto rendimiento; imágenes pequeñas; Native AOT. | Imágenes livianas; excelente en I/O (este módulo es CRUD + reglas); débil en CPU intensivo (no aplica). |
| Coherencia con el frontend | Dos lenguajes. | Dos lenguajes (salvo Blazor). | Un solo lenguaje; tipos/esquemas compartidos API ↔ web. |
| Experiencia del equipo | Baja | Baja | Alta |

### 1.3 Puntaje ponderado (1–5)

| Criterio (peso) | Java | .NET | Node + TS |
|---|---|---|---|
| Arquitectura limpia (25 %) | 5 | 5 | 4 |
| Tipado y dominio (15 %) | 5 | 5 | 3 |
| MongoDB (15 %) | 4 | 4 | 5 |
| Escalabilidad y despliegue (20 %) | 4 | 5 | 4 |
| Experiencia del equipo (25 %) | 2 | 2 | 5 |
| **Total** | **3,90** | **4,10** | **4,25** |
| **Total solo técnico** (sin experiencia, re-normalizado) | 4,53 | **4,80** | 4,00 |

**Conclusión honesta (va en ADR-0001):** técnicamente, .NET 10 es la mejor opción y Java + Spring Boot queda muy cerca; ambas hacen cumplir la arquitectura limpia desde el compilador y traen un tipo decimal nativo. Elegimos **Node.js + TypeScript** porque, al sumar la experiencia del equipo, obtiene el mayor puntaje: reduce el tiempo de entrega y de revisión de código, encaja de forma natural con MongoDB y permite un solo lenguaje con el frontend. Las debilidades técnicas se mitigan así:

| Debilidad | Mitigación en este plan |
|---|---|
| La regla de dependencias no la impone el compilador | Un paquete por anillo con `package.json` que solo declara las dependencias permitidas + `dependency-cruiser` en `pnpm verificar` |
| Tipos solo en compilación | Validación en runtime con zod en la frontera HTTP; constructores de entidades y value objects que validan invariantes |
| `number` flotante para dinero | Value object `Dinero` con centavos en `bigint` |
| Decoradores de NestJS contaminando el núcleo | NestJS solo en `apps/api`; interactores como clases puras registradas con `useFactory` |

### 1.4 Lista de ADRs (formato MADR 4)

Cada ADR en `docs/adr/NNNN-titulo-en-kebab-case.md` con las secciones de MADR: *Contexto y planteamiento del problema*, *Factores de decisión*, *Opciones consideradas*, *Resultado de la decisión* (con *Consecuencias* buenas y malas y *Confirmación*), *Pros y contras de las opciones* e *Información adicional*. Estado: `aceptado`. Fecha: la del commit. Decisores: los cuatro integrantes.

| ADR | Título | Opciones consideradas | Justificación principal |
|---|---|---|---|
| 0000 | Registrar decisiones con MADR | MADR, Nygard, sin ADRs | Formato estándar en Markdown, versionado con el código |
| 0001 | Node.js 24 LTS + TypeScript como plataforma | Java + Spring Boot 4, .NET 10, Node + TS | Tablas 1.2 y 1.3 completas, conclusión y mitigaciones |
| 0002 | NestJS para los anillos externos | NestJS, Express, Fastify | DI y módulos nativos para enlazar puertos con adaptadores; se mantiene fuera del núcleo |
| 0003 | Monorepo pnpm con un paquete por anillo | Monorepo por anillo, back/front separados, proyecto único | La regla de dependencias queda explícita en cada `package.json` y se verifica con `dependency-cruiser` |
| 0004 | MongoDB con driver oficial y mappers | Driver + mappers, Mongoose, Prisma | El agregado se guarda como un documento; los mappers aíslan el dominio; control total de transacciones e índices |
| 0005 | Unidad de trabajo + outbox para eventos | Outbox + bus interno, RabbitMQ, Kafka, bus en memoria | Atomicidad entre agregado, auditoría y eventos sin operar un broker; listo para migrar a uno |
| 0006 | Dinero como value object en centavos | Centavos `bigint`, decimal.js + Decimal128 | Exactitud sin dependencias en el dominio |
| 0007 | Autenticación con JWT propio | Usuarios simulados, JWT propio, Keycloak | Autenticación real con bajo costo operativo; los roles se validan en los casos de uso |
| 0008 | Módulos externos vía HTTP + servicio mock | Mock HTTP, colecciones semilla, stubs en memoria | Simula el contrato real entre módulos; cambiar al módulo real es cambiar una URL |
| 0009 | Evidencias en GridFS | GridFS, solo metadatos + URL, MinIO | Archivos reales sin agregar otro servicio |
| 0010 | React + Vite con contratos zod compartidos | React + Vite, Angular, Next.js | SPA liviana; mismos esquemas de validación en API y web |
| 0011 | Docker Compose para ejecución | Compose, local sin Docker, Compose + CI | Un comando levanta Mongo en replica set (requerido por transacciones), API, mock y web |
| 0012 | Reglas de negocio complementarias y desviaciones del diseño | — | Cierra ambigüedades del diseño (sección 3) y documenta los puertos agregados (sección 4.3) |
| 0013 | Estrategia de pruebas | Unitarias + integración, + E2E API, + E2E web | Las reglas viven en dominio/aplicación; la integración valida transacciones, índices y GridFS |

---

## 2. Reglas de negocio del diseño (trazabilidad)

Cada regla debe tener al menos una prueba cuyo nombre empiece por su código.

| Código | Regla (del diseño) | Dónde se hace cumplir |
|---|---|---|
| R01 | Un desastre solo pasa a Reconstrucción desde Caracterización, nunca directamente desde Registro. | `PoliticaCicloDesastre` (dominio) usada por `PasarAReconstruccion` |
| R02 | Para pasar a Reconstrucción debe existir al menos una evaluación de daños validada que necesite intervención. | `PoliticaCicloDesastre` |
| R03 | El desastre solo se puede cerrar cuando todos sus proyectos están finalizados o cancelados. | `PoliticaCicloDesastre` usada por `CerrarDesastre` |
| R04 | Todo proyecto nace de una o varias evaluaciones de daños validadas y guarda la referencia a ellas. | `ProyectoReconstruccion.crear` (≥1 referencia) + `CrearProyecto` (valida que estén validadas) |
| R05 | Una evaluación no puede estar en dos proyectos activos al mismo tiempo. | `CrearProyecto` (consulta) + índice único parcial en Mongo (garantía ante concurrencia) |
| R06 | Para crear un proyecto se necesita presupuesto mayor que cero, fuente de financiación y responsable. | `ProyectoReconstruccion.crear` |
| R07 | Quien aprueba un proyecto debe ser una persona distinta de quien lo creó. | `ProyectoReconstruccion.aprobar` |
| R08 | Para iniciar la ejecución el proyecto debe tener contratista y un cronograma con al menos un hito. | `ProyectoReconstruccion.iniciarEjecucion` |
| R09 | Para finalizar, el avance debe estar en 100 % y debe existir una evidencia de entrega. | `ProyectoReconstruccion.finalizar` |
| R10 | Un proyecto se puede cancelar en cualquier momento antes de finalizar, indicando el motivo. | `ProyectoReconstruccion.cancelar` + `PoliticaTransiciones` |
| R11 | Todo cambio de presupuesto necesita un motivo y guarda valor anterior, valor nuevo, quién y cuándo. | `ProyectoReconstruccion.solicitarCambioPresupuesto` |
| R12 | Si el cambio supera el umbral configurado, queda pendiente hasta que lo apruebe un usuario autorizado. | `PoliticaAprobacionPresupuesto` + `resolverCambioPresupuesto` + rol `APROBADOR` en `ResolverCambioPresupuesto` |
| R13 | Los costos registrados no pueden superar el presupuesto del proyecto. | `ProyectoReconstruccion.registrarCosto` |
| R14 | El avance solo se registra en ejecución, va de 0 a 100 % y no puede bajar. | `ProyectoReconstruccion.registrarAvance` + value object `Porcentaje` |
| R15 | Un proyecto suspendido no recibe avances ni costos. | `registrarAvance` / `registrarCosto` |
| R16 | El historial de estados, presupuesto y avance no se borra ni se sobrescribe. | Agregado (solo agrega, expone copias) + mapper/repositorio (prueba de integración: los arreglos solo crecen) |
| R17 | Transiciones según el diagrama de estados (Figura 1). | `PoliticaTransiciones` |

### Diagrama de estados (Figura 1)

| Desde \ Acción | aprobar | iniciar | suspender | reanudar | finalizar | cancelar |
|---|---|---|---|---|---|---|
| Formulado | → Aprobado | ✗ | ✗ | ✗ | ✗ | → Cancelado |
| Aprobado | ✗ | → EnEjecucion | ✗ | ✗ | ✗ | → Cancelado |
| EnEjecucion | ✗ | ✗ | → Suspendido | ✗ | → Finalizado | → Cancelado |
| Suspendido | ✗ | ✗ | ✗ | → EnEjecucion | ✗ | → Cancelado |
| Finalizado (final) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Cancelado (final) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

Toda transición agrega un `CambioEstado { anterior, nuevo, motivo, usuario, fechaHora }`. La creación agrega el primero con `anterior = null`, `nuevo = Formulado`.

---

## 3. Supuestos y reglas complementarias (decididas por el equipo)

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

### Definiciones de cálculo

- `avanceFisico` = porcentaje del último `RegistroAvance` (0 si no hay).
- `avanceFinanciero()` = `costosEjecutados / valorVigente × 100`, redondeado a 2 decimales.
- `Hito.desviacion()` = días entre `fechaPlanificada` y `fechaReal` (positivo = atraso); `null` si no hay `fechaReal`.
- `estaAtrasado(hoy)` = existe un hito sin `fechaReal` cuya `fechaPlanificada < hoy` (fecha en America/Bogota). Siempre `false` en estados finales.

### Roles

| Rol | Puede |
|---|---|
| `AUTORIDAD` | Crear proyecto, crear masivo, cancelar proyecto, pasar desastre a Reconstrucción, cerrar desastre |
| `APROBADOR` | Aprobar proyecto, resolver (aprobar/rechazar) cambio de presupuesto |
| `RESPONSABLE` | Iniciar ejecución, registrar avance y costo, solicitar cambio de presupuesto, suspender/reanudar, finalizar, actualizar hitos, adjuntar evidencias (solo en sus proyectos) |
| Todos | Consultar proyectos y desastres |

Un usuario puede tener varios roles. El responsable asignado al crear un proyecto debe existir, estar activo y tener rol `RESPONSABLE`.

### Catálogo de errores

| Código | HTTP | Cuándo |
|---|---|---|
| `NO_ENCONTRADO` | 404 | Proyecto, cambio, hito, evidencia, desastre o evaluación inexistente |
| `NO_AUTORIZADO` | 403 | Rol insuficiente o no es el responsable asignado |
| `NO_AUTENTICADO` | 401 | Sin token o token inválido (lo lanza el guard) |
| `TRANSICION_INVALIDA` | 422 | Acción no permitida en el estado actual (R17) |
| `DATOS_INVALIDOS` | 400 | Falla la validación zod de la entrada |
| `REGLA_NEGOCIO` | 422 | Cualquier otra regla; el detalle lleva el código de la regla (p. ej. `R08`, `C02`) y un mensaje en español |
| `CAMBIO_DESACTUALIZADO` | 409 | C12 |
| `CONFLICTO_CONCURRENCIA` | 409 | Versión optimista desactualizada |
| `EVALUACION_EN_PROYECTO_ACTIVO` | 409 | R05 |
| `SERVICIO_EXTERNO_NO_DISPONIBLE` | 503 | Falla el mock de otros módulos |

Respuesta de error: `{ "codigo": "REGLA_NEGOCIO", "regla": "R08", "mensaje": "...", "detalles": [...] }`.

---

## 4. Arquitectura

### 4.1 Estructura del monorepo

La raíz del repositorio es esta carpeta. El PDF del diseño y la imagen del taller se quedan donde están y se versionan como insumos.

```
.
├── CLAUDE.md
├── PLAN.md
├── taller_capa_negocio_reconstruccion.pdf
├── package.json                 # scripts raíz; private: true
├── pnpm-workspace.yaml          # packages/*, apps/*
├── tsconfig.base.json           # strict, ES2023, module NodeNext
├── eslint.config.js
├── .prettierrc
├── .dependency-cruiser.cjs
├── vitest.workspace.ts
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── adr/                     # 0000 … 0013 (MADR)
│   └── justificacion-tecnologica.md
├── packages/
│   ├── dominio/                 # @reconstruccion/dominio — 0 dependencias
│   ├── aplicacion/              # @reconstruccion/aplicacion — solo dominio
│   ├── infraestructura/         # @reconstruccion/infraestructura — gateways: Mongo, HTTP, GridFS, outbox
│   └── contratos/               # @reconstruccion/contratos — esquemas zod de la API (compartidos con web)
└── apps/
    ├── api/                     # NestJS: controladores, presentadores, auth, composición, despachador outbox, seed
    ├── mock-modulos/            # NestJS mínimo: módulos de desastres y evaluaciones simulados
    └── web/                     # React + Vite
```

Correspondencia con los anillos de la arquitectura limpia (Figura 5):

| Anillo | Paquete |
|---|---|
| Entidades (reglas empresariales) | `packages/dominio` |
| Casos de uso (reglas de aplicación) | `packages/aplicacion` |
| Adaptadores de interfaz | `apps/api` (controladores, presentadores) y `packages/infraestructura` (gateways) |
| Frameworks y drivers | NestJS, driver de MongoDB, GridFS, React |

### 4.2 Reglas de `dependency-cruiser`

| Desde | Puede depender de |
|---|---|
| `packages/dominio` | Solo `packages/dominio` (ni npm ni `node:*`) |
| `packages/aplicacion` | `packages/dominio` |
| `packages/contratos` | `zod` |
| `packages/infraestructura` | `dominio`, `aplicacion`, `mongodb`, `node:*` |
| `apps/api` | Todo excepto `apps/web` y `apps/mock-modulos` |
| `apps/web` | `packages/contratos` y librerías de frontend; nunca `dominio`, `aplicacion`, `infraestructura` |
| Todos | Sin dependencias circulares |

### 4.3 Puertos

**Puertos de entrada** (uno por interactor; los del diseño + los agregados marcados con ★):

`CrearProyecto`, `CrearProyectosMasivo`, `AprobarProyecto`, `IniciarEjecucion`, `SuspenderProyecto`, `ReanudarProyecto`, `FinalizarProyecto`, `CancelarProyecto`, `SolicitarCambioPresupuesto`, `ResolverCambioPresupuesto`, `RegistrarAvance`, `RegistrarCosto`, `ActualizarHito`, `AdjuntarEvidencia`, `ConsultarProyectos`, ★`PasarAReconstruccion`, ★`CerrarDesastre`, ★`ConsultarDesastres`, ★`ConsultarEvaluacionesElegibles`, ★`ObtenerArchivoEvidencia`.

Firma común: `ejecutar(entrada: E, presentador: PresentadorResultado<S>): Promise<void>`.

**Puertos de salida** (los del diseño + los agregados marcados con ★):

| Puerto | Métodos | Adaptador |
|---|---|---|
| `RepositorioProyectos` | `obtener(id)`, `guardar(proyecto)`, `buscar(filtros, pagina)`, `listarPorDesastre(desastreId)`, `evaluacionesEnProyectosActivos(ids)` | `RepositorioProyectosMongo` |
| `ConsultaEvaluaciones` | `obtenerVarias(ids)`, `listarPorDesastre(desastreId)` | `ConsultaEvaluacionesHttp` |
| `ConsultaDesastres` | `obtener(id)`, `listar()` | `ConsultaDesastresHttp` |
| ★`ActualizacionEstadoDesastre` | `cambiarEstado(desastreId, nuevoEstado)` | `ActualizacionEstadoDesastreHttp` |
| `DirectorioUsuariosRoles` | `obtener(usuarioId)` → `{ id, nombre, roles, activo }` | `DirectorioUsuariosMongo` |
| `ParametrosNegocio` | `umbralCambioPresupuesto(): Dinero` | `ParametrosNegocioMongo` (colección `parametros`, valor inicial desde `.env`) |
| `RegistroAuditoria` | `registrar({ usuarioId, operacion, proyectoId?, desastreId?, resultado, codigoError?, detalle?, fechaHora })` | `RegistroAuditoriaMongo` (solo inserta) |
| `PublicadorEventosDominio` | `publicar(eventos)` | `PublicadorOutboxMongo` |
| `Reloj` | `ahora(): Date`, `hoy(): FechaCalendario` (America/Bogota) | `RelojSistema` |
| `PresentadorResultado<S>` | `exito(datos: S)`, `error(fallo: ErrorDominio)` | `PresentadorHttp` (en `apps/api`) |
| ★`UnidadDeTrabajo` | `ejecutar<T>(trabajo: () => Promise<T>): Promise<T>` | `UnidadDeTrabajoMongo` (sesión + transacción en `AsyncLocalStorage`) |
| ★`AlmacenEvidencias` | `guardar(contenido, metadatos) → archivoId`, `abrir(archivoId)`, `eliminar(archivoId)` | `AlmacenEvidenciasGridFS` |
| ★`GeneradorIds` | `nuevo(): string` | `GeneradorIdsUuid` |

Los puertos ★ son desviaciones del diseño original y se documentan en ADR-0012: los de desastres por la decisión de implementar sus casos de uso; `UnidadDeTrabajo` para la atomicidad del paso 4–5; `AlmacenEvidencias` porque las evidencias son archivos; `GeneradorIds` para mantener el dominio puro.

### 4.4 Plantilla de un interactor (pasos del diseño, Figura 6)

```ts
async ejecutar(entrada, presentador) {
  try {
    // 1. Autorizar (DirectorioUsuariosRoles) y validar condiciones de otros módulos
    // 2. Cargar el agregado (RepositorioProyectos.obtener) → NO_ENCONTRADO
    // 3. Pedir a la entidad que aplique la regla (pasando reloj.ahora() y políticas)
    // 4–5. unidadDeTrabajo.ejecutar(async () => {
    //        await repositorio.guardar(proyecto);
    //        await auditoria.registrar({... resultado: 'EXITO' });
    //        await publicador.publicar(proyecto.extraerEventos());
    //      });
    presentador.exito(mapearSalida(proyecto));
  } catch (e) {
    if (!(e instanceof ErrorDominio)) throw e;
    await auditoria.registrar({... resultado: 'RECHAZO', codigoError: e.codigo }); // fuera de la transacción
    presentador.error(e);
  }
}
```

Crea una clase base `InteractorConAuditoria` que encapsule el `try/catch`, la auditoría de rechazos y la llamada al presentador, para no repetirlos en cada interactor.

### 4.5 Flujo de ejemplo: SolicitarCambioPresupuesto (Figura 7)

1. El controlador llama `ejecutar(solicitud, presentador)`.
2. El interactor verifica rol `RESPONSABLE` y obtiene el proyecto.
3. Lee el umbral (`ParametrosNegocio`) y crea `new PoliticaAprobacionPresupuesto(umbral)`.
4. Llama `proyecto.solicitarCambioPresupuesto(valor, motivo, usuario, politica, ahora, idCambio)`.
5. La entidad valida R11, C02, C04, C10 y pregunta a la política `requiereAprobacion(variacion)`.
6. La entidad aplica el cambio (`Aplicado`) o lo deja `Pendiente`, y registra el evento.
7. En la unidad de trabajo: `guardar`, `auditoria.registrar`, `publicar`.
8. `presentador.exito({ cambioId, estado, valorVigente })`.

---

## 5. Modelo de dominio (`packages/dominio`)

```
src/
├── comun/
│   ├── Dinero.ts              # centavos bigint; desde(string pesos) / aTextoPesos(); sumar, restar, comparar, abs, esPositivo
│   ├── Porcentaje.ts          # 0..100 con 2 decimales (entero en centésimas)
│   ├── FechaCalendario.ts     # fecha sin hora (YYYY-MM-DD); diferenciaEnDias
│   ├── ErrorDominio.ts        # base + subclases: ReglaNegocioViolada(regla), TransicionInvalida, NoAutorizado, NoEncontrado, CambioDesactualizado, EvaluacionEnProyectoActivo, ConflictoConcurrencia, ServicioExternoNoDisponible
│   └── EventoDominio.ts       # { tipo, agregadoId, ocurridoEn, datos }
├── proyecto/
│   ├── ProyectoReconstruccion.ts   # raíz del agregado
│   ├── EstadoProyecto.ts           # Formulado | Aprobado | EnEjecucion | Suspendido | Finalizado | Cancelado
│   ├── Presupuesto.ts              # valorVigente, fuenteFinanciacion, costosEjecutados
│   ├── CambioPresupuesto.ts        # id, valorAnterior, valorNuevo, motivo, estado, solicitanteId, autorizanteId?, solicitadoEn, resueltoEn?, motivoResolucion?
│   ├── EstadoCambioPresupuesto.ts  # Aplicado | Pendiente | Aprobado | Rechazado | Anulado
│   ├── Hito.ts                     # id, nombre, fechaPlanificada, fechaReal?; desviacion()
│   ├── RegistroAvance.ts           # avanceFisico (Porcentaje), usuarioId, fechaHora
│   ├── Costo.ts                    # id, valor (Dinero), concepto, usuarioId, fechaHora
│   ├── Evidencia.ts                # id, tipo, autorId, fechaHora, archivoId, nombreArchivo, tipoMime, tamanoBytes
│   ├── TipoEvidencia.ts
│   ├── CambioEstado.ts             # anterior, nuevo, motivo, usuarioId, fechaHora
│   ├── ReferenciaEvaluacion.ts     # evaluacionId, activoId, nivelDano
│   ├── Contratista.ts              # nit, nombre
│   ├── TipoIntervencion.ts
│   ├── NivelDano.ts
│   └── eventos/                    # ProyectoCreado, ProyectoAprobado, EjecucionIniciada, ProyectoSuspendido, ProyectoReanudado, ProyectoFinalizado, ProyectoCancelado, CambioPresupuestoSolicitado, CambioPresupuestoAplicado, CambioPresupuestoRechazado, AvanceRegistrado, CostoRegistrado, HitoActualizado, EvidenciaAdjuntada
├── desastre/
│   ├── EstadoDesastre.ts           # REGISTRO | CARACTERIZACION | RECONSTRUCCION | CERRADO
│   └── eventos/                    # DesastrePasoAReconstruccion, DesastreCerrado
├── politicas/
│   ├── PoliticaTransiciones.ts         # tabla de la sección 2; verificar(estado, accion) → nuevoEstado | TransicionInvalida
│   ├── PoliticaAprobacionPresupuesto.ts # constructor(umbral: Dinero); requiereAprobacion(variacion: Dinero): boolean
│   ├── PoliticaTipoIntervencion.ts      # verificar(tipo, nivelesDano[]) (C05)
│   └── PoliticaCicloDesastre.ts         # verificarPasoAReconstruccion(estado, evaluaciones), verificarCierre(estado, estadosProyectos)
└── index.ts
```

Métodos de `ProyectoReconstruccion` (los del diseño, con `ahora` y los ids como parámetros para mantener la pureza):

| Método | Reglas |
|---|---|
| `static crear(datos, politicaTipoIntervencion, ahora, id)` | R04, R06, C05, C06 (sin repetidas) |
| `static reconstituir(instantanea)` | Sin validaciones ni eventos (lo usa el repositorio) |
| `aprobar(usuarioId, ahora)` | R07, R17 |
| `iniciarEjecucion(usuarioId, ahora, contratista?)` | R08, R17, C10, C16 |
| `suspender(motivo, usuarioId, ahora)` / `reanudar(motivo, usuarioId, ahora)` | R17, C10, C14 |
| `finalizar(usuarioId, ahora)` | R09, R17, C10, C13 |
| `cancelar(motivo, usuarioId, ahora)` | R10, R17, C13, C14, C17 |
| `solicitarCambioPresupuesto(valor, motivo, usuarioId, politica, ahora, idCambio)` | R11, R12, C01, C02, C04, C10 |
| `resolverCambioPresupuesto(cambioId, decision, motivo, usuarioId, ahora)` | R12, C02, C03, C04, C12 |
| `registrarAvance(porcentaje, usuarioId, ahora)` | R14, R15, C10 |
| `registrarCosto(valor, concepto, usuarioId, ahora, idCosto)` | R13, R15, C10, C11 |
| `agregarHito` / `editarHito` / `eliminarHito` / `registrarFechaRealHito` | C08, C10 |
| `verificarPuedeAdjuntarEvidencia(usuarioId)` y `adjuntarEvidencia(datos, ahora)` | C09, C10 |
| `avanceFisico()`, `avanceFinanciero()`, `estaAtrasado(hoy)`, `cambiosPendientes()` | Cálculos de la sección 3 |
| `extraerEventos()` | Devuelve y vacía los eventos pendientes |
| `aInstantanea()` | Copia de solo lectura para el mapper |

`version` (entero) vive en el agregado para la concurrencia optimista; el repositorio la incrementa.

---

## 6. Persistencia (MongoDB 8, replica set `rs0`)

Base de datos `reconstruccion`. Colecciones:

**`proyectos`** (un documento por agregado):

```json
{
  "_id": "uuid", "version": 3, "activo": true,
  "desastreId": "D-002", "tipoIntervencion": "RECONSTRUCCION", "estado": "EnEjecucion",
  "activosIntervenidos": ["A-10"], "responsableId": "u-resp-1", "creadoPor": "u-aut-1", "aprobadoPor": "u-apr-1",
  "contratista": { "nit": "900123456-7", "nombre": "Constructora X" },
  "referenciasEvaluacion": [{ "evaluacionId": "E-21", "activoId": "A-10", "nivelDano": "SEVERO" }],
  "presupuesto": { "valorVigente": { "$numberLong": "250000000000" }, "fuenteFinanciacion": "SGR", "costosEjecutados": { "$numberLong": "0" } },
  "cambiosPresupuesto": [], "hitos": [], "avances": [], "costos": [], "evidencias": [], "historialEstados": [],
  "creadoEn": "ISODate", "actualizadoEn": "ISODate"
}
```

Índices: `{ desastreId: 1, estado: 1 }`, `{ responsableId: 1 }`, `{ "hitos.fechaPlanificada": 1 }` y el **único parcial** `{ "referenciasEvaluacion.evaluacionId": 1 }` con `partialFilterExpression: { activo: true }` (R05 ante concurrencia; su violación `E11000` se traduce a `EvaluacionEnProyectoActivo`).

`guardar`: si es nuevo, `insertOne` con `version: 1`; si existe, `replaceOne({ _id, version })` con `version + 1`; si `matchedCount === 0` → `ConflictoConcurrencia`. El mapper nunca elimina elementos de `historialEstados`, `cambiosPresupuesto` ni `avances` (prueba R16).

**`outbox`**: `{ _id, tipo, agregadoId, datos, ocurridoEn, publicadoEn: null, intentos }`, índice `{ publicadoEn: 1, ocurridoEn: 1 }`.
**`auditoria`**: `{ _id, usuarioId, operacion, proyectoId?, desastreId?, resultado: "EXITO" | "RECHAZO", codigoError?, detalle?, fechaHora }`. Solo inserciones.
**`usuarios`**: `{ _id, nombre, correo (único), hashContrasena (argon2id), roles: [], activo }`.
**`parametros`**: `{ _id: "umbralCambioPresupuesto", valorCentavos: Long }`.
**GridFS** bucket `evidencias` (metadatos: `proyectoId`, `autorId`, `tipo`).

**Unidad de trabajo:** `UnidadDeTrabajoMongo` abre `client.startSession()` y `session.withTransaction(...)`, guarda la sesión en `AsyncLocalStorage`; los adaptadores leen la sesión del contexto si existe. `AdjuntarEvidencia` guarda el archivo en GridFS **antes** de la transacción y lo elimina (compensación) si la transacción falla.

**Despachador del outbox** (en `apps/api`): cada 1 s lee hasta 50 eventos con `publicadoEn: null` ordenados por `ocurridoEn`, los emite en un `BusEventosEnProceso` y marca `publicadoEn`. Suscriptor inicial: `RegistradorEventosLog` (log estructurado). Si un suscriptor falla, incrementa `intentos` y reintenta en el siguiente ciclo.

---

## 7. Servicio mock de otros módulos (`apps/mock-modulos`)

NestJS mínimo en el puerto 3001, con datos semilla en `apps/mock-modulos/datos/*.json` cargados en memoria al arrancar.

| Método y ruta | Respuesta |
|---|---|
| `GET /desastres` | Lista `{ id, nombre, estado, municipio, fechaOcurrencia }` |
| `GET /desastres/:id` | Un desastre o 404 |
| `PATCH /desastres/:id/estado` | `{ estado }` → actualiza en memoria |
| `GET /evaluaciones?desastreId=` | Evaluaciones del desastre |
| `GET /evaluaciones?ids=E-1,E-2` | Varias por id |

Evaluación: `{ id, desastreId, activoId, nivelDano, estado: "BORRADOR" | "VALIDADA", requiereIntervencion }`.

Semilla mínima (para poder probar todos los caminos):
- `D-001` en CARACTERIZACION con evaluaciones validadas que requieren intervención (sirve para R01/R02).
- `D-002` en RECONSTRUCCION con 6 evaluaciones: niveles LEVE, MODERADO, SEVERO y TOTAL validadas con intervención; una en BORRADOR; una validada sin intervención.
- `D-003` en REGISTRO (para probar R01).
- `D-004` en CARACTERIZACION sin evaluaciones que requieran intervención (para R02).

---

## 8. API REST (`apps/api`, NestJS, base `/api/v1`)

Autenticación: `POST /auth/login { correo, contrasena }` → `{ token, usuario: { id, nombre, roles } }`. JWT HS256, expira en 8 h (`JWT_EXPIRA_EN`), secreto `JWT_SECRET`. Un guard global exige el token en todas las rutas excepto login y salud; el decorador `@UsuarioActual()` entrega el `usuarioId` al controlador. **La autorización por rol la hacen los interactores**, no el guard.

| Método y ruta | Caso de uso | Rol |
|---|---|---|
| `GET /salud` | — | público |
| `GET /desastres` | ConsultarDesastres | todos |
| `GET /desastres/:id/evaluaciones-elegibles` | ConsultarEvaluacionesElegibles (validadas, con intervención, no usadas en proyectos activos) | todos |
| `POST /desastres/:id/pasar-a-reconstruccion` | PasarAReconstruccion | AUTORIDAD |
| `POST /desastres/:id/cerrar` | CerrarDesastre | AUTORIDAD |
| `POST /proyectos` | CrearProyecto | AUTORIDAD |
| `POST /proyectos/masivo` | CrearProyectosMasivo | AUTORIDAD |
| `GET /proyectos?desastreId&estado&responsableId&atrasado&pagina&tamano` | ConsultarProyectos | todos |
| `GET /proyectos/:id` | ConsultarProyectos (detalle con historial, `avanceFisico`, `avanceFinanciero`, `estaAtrasado`, `cambiosPendientes`) | todos |
| `POST /proyectos/:id/aprobar` | AprobarProyecto | APROBADOR |
| `POST /proyectos/:id/iniciar` `{ contratista? }` | IniciarEjecucion | RESPONSABLE |
| `POST /proyectos/:id/suspender` `{ motivo }` | SuspenderProyecto | RESPONSABLE |
| `POST /proyectos/:id/reanudar` `{ motivo }` | ReanudarProyecto | RESPONSABLE |
| `POST /proyectos/:id/finalizar` | FinalizarProyecto | RESPONSABLE |
| `POST /proyectos/:id/cancelar` `{ motivo }` | CancelarProyecto | AUTORIDAD |
| `POST /proyectos/:id/cambios-presupuesto` `{ valorNuevo, motivo }` | SolicitarCambioPresupuesto | RESPONSABLE |
| `POST /proyectos/:id/cambios-presupuesto/:cambioId/resolucion` `{ decision: "APROBAR" \| "RECHAZAR", motivo? }` | ResolverCambioPresupuesto | APROBADOR |
| `POST /proyectos/:id/avances` `{ porcentaje }` | RegistrarAvance | RESPONSABLE |
| `POST /proyectos/:id/costos` `{ valor, concepto }` | RegistrarCosto | RESPONSABLE |
| `POST /proyectos/:id/hitos` `{ nombre, fechaPlanificada }` | ActualizarHito (agregar) | RESPONSABLE |
| `PATCH /proyectos/:id/hitos/:hitoId` `{ nombre?, fechaPlanificada?, fechaReal? }` | ActualizarHito (editar / fecha real) | RESPONSABLE |
| `DELETE /proyectos/:id/hitos/:hitoId` | ActualizarHito (eliminar) | RESPONSABLE |
| `POST /proyectos/:id/evidencias` (multipart: `archivo`, `tipo`) | AdjuntarEvidencia | RESPONSABLE |
| `GET /proyectos/:id/evidencias/:evidenciaId/archivo` | ObtenerArchivoEvidencia | todos |

Formatos: dinero como **string en pesos con hasta 2 decimales** (`"2500000000.00"`); fechas-hora ISO 8601 UTC; fechas de calendario `YYYY-MM-DD`; porcentajes como número con hasta 2 decimales. Los esquemas zod de entrada y salida viven en `@reconstruccion/contratos`; la API los usa con `nestjs-zod` (validación + Swagger en `/api/docs`).

Composición: un módulo Nest por grupo (`ProyectosModule`, `DesastresModule`, `AuthModule`, `InfraestructuraModule`). Los puertos de salida se registran con tokens `Symbol` y los interactores con `useFactory` (son clases puras, sin `@Injectable`). `PresentadorHttp<S>` guarda el resultado y, en caso de error, lanza la `HttpException` según el catálogo de errores.

Seed (`pnpm --filter api seed`): crea índices, el parámetro de umbral y los usuarios de desarrollo:

| Correo | Contraseña | Roles |
|---|---|---|
| autoridad@reconstruccion.dev | `Clave123*` | AUTORIDAD |
| aprobador1@reconstruccion.dev | `Clave123*` | APROBADOR |
| aprobador2@reconstruccion.dev | `Clave123*` | APROBADOR |
| responsable1@reconstruccion.dev | `Clave123*` | RESPONSABLE |
| responsable2@reconstruccion.dev | `Clave123*` | RESPONSABLE |
| autoridad.aprobadora@reconstruccion.dev | `Clave123*` | AUTORIDAD, APROBADOR (para probar R07) |

---

## 9. Frontend (`apps/web`, React + Vite)

Librerías: React Router, TanStack Query, react-hook-form + `@hookform/resolvers/zod` con los esquemas de `@reconstruccion/contratos`, Mantine (componentes y notificaciones), PapaParse (CSV). El token se guarda en memoria + `sessionStorage`; un interceptor agrega `Authorization`. En desarrollo Vite redirige `/api` a `http://localhost:3000`.

| Pantalla | Rol | Contenido |
|---|---|---|
| Login | — | Correo y contraseña |
| Proyectos | todos | Tabla con filtros (desastre, estado, responsable, atrasado), indicadores de avance físico/financiero y bandera de atraso |
| Detalle de proyecto | todos | Pestañas: Resumen, Hitos, Avances, Costos, Presupuesto (cambios y su estado), Evidencias (subir y descargar), Historial de estados. Los botones de acción se muestran según rol, estado y si el usuario es el responsable asignado |
| Nuevo proyecto | AUTORIDAD | Seleccionar desastre → evaluaciones elegibles → tipo de intervención (filtrado según C05), presupuesto, fuente, responsable, contratista opcional |
| Carga masiva | AUTORIDAD | Subir CSV (`desastreId,evaluaciones,tipoIntervencion,presupuesto,fuenteFinanciacion,responsableId,contratistaNit,contratistaNombre`; evaluaciones separadas por `;`), vista previa, envío y reporte por fila |
| Bandeja del aprobador | APROBADOR | Proyectos en Formulado y cambios de presupuesto pendientes, con aprobar/rechazar |
| Desastres | AUTORIDAD | Lista con estado; acciones "Pasar a Reconstrucción" y "Cerrar" |

Los errores de la API se muestran con su `mensaje` y el código de la regla (p. ej. "R08 — El proyecto necesita contratista y al menos un hito").

---

## 10. Docker Compose

| Servicio | Imagen / build | Puerto | Notas |
|---|---|---|---|
| `mongo` | `mongo:8` | 27017 | `--replSet rs0`; healthcheck que ejecuta `rs.initiate()` si hace falta; volumen `datos-mongo` |
| `mock-modulos` | `apps/mock-modulos/Dockerfile` | 3001 | |
| `api` | `apps/api/Dockerfile` (multi-stage, `node:24-alpine`) | 3000 | Depende de mongo (healthy) y mock; ejecuta seed idempotente al arrancar |
| `web` | `apps/web/Dockerfile` (build Vite + `nginx:alpine`) | 8080 | nginx redirige `/api` a `api:3000` |

`.env.example`: `MONGO_URI=mongodb://mongo:27017/reconstruccion?replicaSet=rs0`, `JWT_SECRET=cambiar-en-produccion`, `JWT_EXPIRA_EN=8h`, `UMBRAL_CAMBIO_PRESUPUESTO=50000000`, `URL_MODULOS_EXTERNOS=http://mock-modulos:3001`, `TZ=America/Bogota`, `PUERTO_API=3000`.

---

## 11. Fases de implementación

> Después de cada fase: `pnpm verificar` en verde, criterios de aceptación revisados, casillas marcadas y un commit.

### Fase 0 — Monorepo y herramientas
- [x] `git init`, `.gitignore` (node_modules, dist, coverage, .env, *.log).
- [x] `package.json` raíz (`private`, `packageManager: pnpm`, `engines.node >= 24`), `pnpm-workspace.yaml`, `.nvmrc` con `24`.
- [x] `tsconfig.base.json` estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `target ES2023`, `module/moduleResolution NodeNext`) y `tsconfig.json` por paquete con referencias de proyecto.
- [x] Crear los paquetes vacíos (`dominio`, `aplicacion`, `infraestructura`, `contratos`) y las apps (`api`, `mock-modulos`, `web`) con su `package.json`, declarando **solo** las dependencias permitidas (sección 4.2).
- [x] ESLint (typescript-eslint, reglas estrictas, prohibir `any`) + Prettier.
- [x] Vitest con `vitest.workspace.ts`; cobertura con `@vitest/coverage-v8`.
- [x] `.dependency-cruiser.cjs` con las reglas de la sección 4.2, incluida la prohibición de `node:*` y npm en `dominio`.
- [x] Scripts raíz: `lint`, `typecheck`, `arq`, `test`, `test:cobertura`, `verificar` (los cuatro primeros en cadena), `dev`, `build`.

**Aceptación:** `pnpm install && pnpm verificar` pasa. Una importación de prueba de `mongodb` dentro de `dominio` hace fallar `pnpm arq` (verifícalo y revierte).
**Commit:** `chore: estructura del monorepo y herramientas de calidad`

### Fase 1 — Justificación: ADRs (MADR) y documento resumen
- [ ] `docs/adr/0000-registrar-decisiones-con-madr.md` … `0013-estrategia-de-pruebas.md` según la tabla 1.4, en español, con el contenido de las secciones 1 a 3 de este plan.
- [ ] ADR-0001 incluye las tablas 1.2 y 1.3, la conclusión honesta y la tabla de mitigaciones.
- [ ] ADR-0012 lista todas las reglas complementarias C01–C17 y los puertos agregados (sección 4.3) como desviaciones del diseño, cada una con su justificación.
- [ ] `docs/justificacion-tecnologica.md`: resumen de una o dos páginas para entregar en el taller (criterios, tabla de trade-offs, puntaje, decisión, mitigaciones, mapa de tecnologías por anillo de la arquitectura limpia y un índice con enlaces a los ADRs).
- [ ] `docs/adr/README.md` con el índice de ADRs.

**Aceptación:** existen 14 ADRs con todas las secciones MADR; cada decisión D1–D14 queda cubierta por al menos un ADR.
**Commit:** `docs(adr): justificación de tecnologías en formato MADR`

### Fase 2 — Dominio (`packages/dominio`)
- [ ] Value objects `Dinero`, `Porcentaje`, `FechaCalendario`, con pruebas (aritmética exacta, conversión desde y hacia string en pesos, valores inválidos).
- [ ] `ErrorDominio` y subclases según el catálogo de errores.
- [ ] Enumeraciones y entidades de la sección 5.
- [ ] Políticas: `PoliticaTransiciones`, `PoliticaAprobacionPresupuesto`, `PoliticaTipoIntervencion`, `PoliticaCicloDesastre`.
- [ ] `ProyectoReconstruccion` con todos los métodos de la tabla de la sección 5, eventos de dominio, `version`, `aInstantanea` y `reconstituir`.
- [ ] Pruebas unitarias: una por regla como mínimo (R04, R06–R17, C01–C05, C08–C17) y las 36 combinaciones de la tabla de transiciones.
- [ ] Builder de pruebas `unProyecto().enEstado('EnEjecucion').conHito()...` para que las pruebas sean legibles.

**Aceptación:** cobertura de líneas de `dominio` ≥ 90 %; `pnpm arq` confirma 0 dependencias externas; ningún `Date.now`/`new Date()` en `src` (agrega una regla de ESLint `no-restricted-syntax` para `dominio` y `aplicacion`).
**Commit:** `feat(dominio): agregado ProyectoReconstruccion, políticas y reglas de negocio`

### Fase 3 — Casos de uso (`packages/aplicacion`)
- [ ] Interfaces de los puertos de entrada y de salida (sección 4.3) y DTOs de entrada/salida de la aplicación (tipos planos).
- [ ] `InteractorConAuditoria` (sección 4.4).
- [ ] Los 20 interactores. Cada uno: autoriza el rol con `DirectorioUsuariosRoles`, valida las condiciones de otros módulos, carga el agregado, delega en la entidad, guarda/audita/publica en `UnidadDeTrabajo` y presenta.
- [ ] `CrearProyecto`: R04, R05 (consulta `evaluacionesEnProyectosActivos`), C05, C06, valida que el responsable tenga rol `RESPONSABLE`.
- [ ] `CrearProyectosMasivo`: reutiliza `CrearProyecto` ítem por ítem (C07) y arma el reporte.
- [ ] `PasarAReconstruccion` y `CerrarDesastre`: usan `PoliticaCicloDesastre`, llaman `ActualizacionEstadoDesastre`, auditan y publican `DesastrePasoAReconstruccion` / `DesastreCerrado`.
- [ ] `AdjuntarEvidencia`: valida con la entidad, guarda el archivo, agrega la evidencia; compensa eliminando el archivo si falla la transacción.
- [ ] Fakes en memoria de todos los puertos de salida en `packages/aplicacion/test/fakes` (repositorio con control de versión, reloj fijo, auditoría y publicador que registran las llamadas, unidad de trabajo que hace rollback de los fakes si el trabajo lanza).
- [ ] Pruebas por interactor: camino feliz, rol incorrecto (`NO_AUTORIZADO`), recurso inexistente (`NO_ENCONTRADO`), al menos una regla violada, auditoría de éxito y de rechazo, eventos publicados.

**Aceptación:** cobertura de `aplicacion` ≥ 85 %; ningún interactor contiene una regla de la sección 2 que deba estar en la entidad (revisión manual: cada `if` de negocio está en dominio).
**Commit:** `feat(aplicacion): interactores, puertos y pruebas con fakes`

### Fase 4 — Infraestructura (`packages/infraestructura`)
- [ ] Conexión Mongo y `ContextoSesion` con `AsyncLocalStorage`.
- [ ] `UnidadDeTrabajoMongo`.
- [ ] `MapperProyecto` (documento ↔ instantánea, `Dinero` ↔ `Long`, `FechaCalendario` ↔ `Date` a medianoche UTC) y `RepositorioProyectosMongo` con concurrencia optimista, filtros (`atrasado` con `$elemMatch` sobre hitos) y paginación.
- [ ] Creación de índices (`crearIndices()`), incluido el único parcial de R05.
- [ ] `PublicadorOutboxMongo`, `RegistroAuditoriaMongo`, `ParametrosNegocioMongo`, `DirectorioUsuariosMongo`, `AlmacenEvidenciasGridFS`, `RelojSistema`, `GeneradorIdsUuid`.
- [ ] Clientes HTTP (`fetch` nativo con timeout de 3 s): `ConsultaDesastresHttp`, `ConsultaEvaluacionesHttp`, `ActualizacionEstadoDesastreHttp`; los errores de red o 5xx se traducen a `ServicioExternoNoDisponible`.
- [ ] Pruebas de integración con `MongoMemoryReplSet`: ida y vuelta del agregado completo; `ConflictoConcurrencia`; índice único de R05 con dos inserciones concurrentes; la transacción revierte agregado + auditoría + outbox juntos; R16 (los arreglos de historial solo crecen tras varias operaciones); GridFS guardar/abrir/eliminar; filtro `atrasado`.
- [ ] Pruebas de los clientes HTTP contra un servidor `node:http` local levantado en la prueba.

**Aceptación:** `pnpm test` ejecuta las pruebas de integración sin Docker; todas pasan.
**Commit:** `feat(infraestructura): adaptadores MongoDB, GridFS, outbox y clientes HTTP`

### Fase 5 — Servicio mock (`apps/mock-modulos`)
- [ ] App NestJS con las rutas de la sección 7 y los datos semilla.
- [ ] `Dockerfile`.

**Aceptación:** `pnpm --filter mock-modulos dev` responde a todas las rutas; la semilla cubre los cuatro desastres descritos.
**Commit:** `feat(mock-modulos): servicio simulado de desastres y evaluaciones`

### Fase 6 — Contratos y API (`packages/contratos`, `apps/api`)
- [ ] Esquemas zod de entrada y salida de cada ruta en `@reconstruccion/contratos` (dinero como string en pesos con regex, fechas, enumeraciones).
- [ ] `AuthModule`: login con argon2id, emisión y verificación de JWT, guard global, decorador `@UsuarioActual()`.
- [ ] Controladores de la sección 8, `PresentadorHttp` y filtro de excepciones que produce el formato de error del catálogo.
- [ ] Composición: tokens de puertos, `useFactory` para interactores, configuración por variables de entorno validada con zod al arrancar.
- [ ] Subida multipart para evidencias (límite 10 MB, tipos PDF/JPG/PNG) y descarga en streaming desde GridFS.
- [ ] Despachador del outbox y `RegistradorEventosLog`.
- [ ] Script de seed idempotente (sección 8) que también crea índices.
- [ ] Swagger en `/api/docs`.
- [ ] `Dockerfile` multi-stage.

**Aceptación:** con Mongo en replica set y el mock arriba, se puede recorrer por HTTP (Swagger o `curl`) el ciclo completo: login → crear → aprobar (otro usuario) → hitos → iniciar → avance 100 → evidencia de entrega → finalizar; y se observa un 422 con `regla: "R07"` cuando el creador intenta aprobar.
**Commit:** `feat(api): API REST con NestJS, JWT y composición de la arquitectura limpia`

### Fase 7 — Frontend (`apps/web`)
- [ ] Proyecto Vite + React + TS, Mantine, React Router, TanStack Query, cliente HTTP con token.
- [ ] Pantallas de la sección 9 con formularios validados por los esquemas de `@reconstruccion/contratos`.
- [ ] Acciones visibles según rol, estado y responsable asignado; mensajes de error con código de regla.
- [ ] `Dockerfile` (build + nginx con proxy `/api`).

**Aceptación:** con `pnpm dev`, cada uno de los tres actores puede completar sus casos de uso de la Figura 2 desde el navegador; `pnpm arq` confirma que `web` no importa dominio, aplicación ni infraestructura.
**Commit:** `feat(web): interfaz React para autoridad, aprobador y responsable`

### Fase 8 — Docker Compose y documentación de uso
- [ ] `docker-compose.yml` según la sección 10, `.env.example`.
- [ ] `README.md`: requisitos, cómo levantar todo, usuarios de prueba, mapa de carpetas ↔ anillos de la arquitectura limpia, enlaces a ADRs y a la justificación.
- [ ] `docs/guion-demo.md`: recorrido paso a paso para la sustentación que muestra R01, R05, R07, R08, R09, R12 (cambio sobre el umbral → pendiente → aprobado por otro usuario), R13, R14 y R15.

**Aceptación:** desde cero, `cp .env.example .env && docker compose up --build` deja la web en `http://localhost:8080` funcionando con los usuarios semilla.
**Commit:** `chore: docker compose, README y guion de demostración`

### Fase 9 — Verificación final
- [ ] `pnpm verificar` y `pnpm test:cobertura` en verde (dominio ≥ 90 %, aplicación ≥ 85 %).
- [ ] Generar `docs/trazabilidad.md`: tabla regla (R01–R17, C01–C17) → archivo donde se aplica → prueba(s) que la verifican. Toda regla debe tener al menos una prueba; si falta alguna, agrégala.
- [ ] Recorrer `docs/guion-demo.md` contra el sistema levantado con Docker Compose y corregir lo que falle.
- [ ] Revisar que cada ADR coincida con lo implementado (versiones reales instaladas incluidas).

**Aceptación:** trazabilidad completa sin huecos; guion de demo ejecutado sin errores.
**Commit:** `docs: trazabilidad de reglas y verificación final`
