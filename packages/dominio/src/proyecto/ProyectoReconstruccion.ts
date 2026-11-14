import { Dinero } from '../comun/Dinero.js';
import {
  NoAutorizado,
  NoEncontrado,
  ReglaNegocioViolada,
  CambioDesactualizado,
} from '../comun/ErrorDominio.js';
import type { EventoDominio } from '../comun/EventoDominio.js';
import type { FechaCalendario } from '../comun/FechaCalendario.js';
import { Porcentaje } from '../comun/Porcentaje.js';
import type { PoliticaAprobacionPresupuesto } from '../politicas/PoliticaAprobacionPresupuesto.js';
import type { PoliticaTipoIntervencion } from '../politicas/PoliticaTipoIntervencion.js';
import { PoliticaTransiciones, type AccionProyecto } from '../politicas/PoliticaTransiciones.js';
import type { CambioEstado } from './CambioEstado.js';
import type { CambioPresupuesto } from './CambioPresupuesto.js';
import type { Contratista } from './Contratista.js';
import type { Costo } from './Costo.js';
import { EstadoCambioPresupuesto } from './EstadoCambioPresupuesto.js';
import { EstadoProyecto } from './EstadoProyecto.js';
import type { Evidencia } from './Evidencia.js';
import { eventoProyecto, type TipoEventoProyecto } from './eventos/EventosProyecto.js';
import { Hito } from './Hito.js';
import type { Presupuesto } from './Presupuesto.js';
import type { ReferenciaEvaluacion } from './ReferenciaEvaluacion.js';
import type { RegistroAvance } from './RegistroAvance.js';
import { TipoEvidencia } from './TipoEvidencia.js';
import type { TipoIntervencion } from './TipoIntervencion.js';

/** Copia de solo lectura del estado del agregado; la usan el mapper y el repositorio. */
export interface InstantaneaProyecto {
  readonly id: string;
  readonly version: number;
  readonly activo: boolean;
  readonly desastreId: string;
  readonly tipoIntervencion: TipoIntervencion;
  readonly estado: EstadoProyecto;
  readonly responsableId: string;
  readonly creadoPor: string;
  readonly aprobadoPor: string | null;
  readonly contratista: Contratista | null;
  readonly referenciasEvaluacion: readonly ReferenciaEvaluacion[];
  readonly presupuesto: Presupuesto;
  readonly cambiosPresupuesto: readonly CambioPresupuesto[];
  readonly hitos: readonly Hito[];
  readonly avances: readonly RegistroAvance[];
  readonly costos: readonly Costo[];
  readonly evidencias: readonly Evidencia[];
  readonly historialEstados: readonly CambioEstado[];
  readonly creadoEn: Date;
  readonly actualizadoEn: Date;
}

export interface DatosNuevoProyecto {
  readonly desastreId: string;
  readonly tipoIntervencion: TipoIntervencion;
  readonly referenciasEvaluacion: readonly ReferenciaEvaluacion[];
  readonly presupuesto: Dinero;
  readonly fuenteFinanciacion: string;
  readonly responsableId: string;
  readonly creadoPor: string;
  readonly contratista?: Contratista | undefined;
}

export interface DatosEvidencia {
  readonly id: string;
  readonly tipo: TipoEvidencia;
  readonly autorId: string;
  readonly archivoId: string;
  readonly nombreArchivo: string;
  readonly tipoMime: string;
  readonly tamanoBytes: number;
}

export type DecisionCambio = 'APROBAR' | 'RECHAZAR';

const MIMES_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES_EVIDENCIA = 10 * 1024 * 1024;
const ESTADOS_ACTIVOS: readonly EstadoProyecto[] = ['Formulado', 'Aprobado', 'EnEjecucion', 'Suspendido'];
const transiciones = new PoliticaTransiciones();

function vacio(texto: string | undefined): boolean {
  return texto === undefined || texto.trim() === '';
}

export class ProyectoReconstruccion {
  private readonly eventos: EventoDominio[] = [];

  private constructor(private d: Mutable) {}

  // ---------------------------------------------------------------- creación

  static crear(
    datos: DatosNuevoProyecto,
    politicaTipo: PoliticaTipoIntervencion,
    ahora: Date,
    id: string,
  ): ProyectoReconstruccion {
    if (datos.referenciasEvaluacion.length === 0) {
      throw new ReglaNegocioViolada(
        'R04',
        'El proyecto debe nacer de al menos una evaluación de daños validada.',
      );
    }
    const ids = datos.referenciasEvaluacion.map((r) => r.evaluacionId);
    if (new Set(ids).size !== ids.length) {
      throw new ReglaNegocioViolada('C06', 'Las evaluaciones no pueden repetirse dentro del proyecto.');
    }
    if (!datos.presupuesto.esPositivo()) {
      throw new ReglaNegocioViolada('R06', 'El presupuesto debe ser mayor que cero.');
    }
    if (vacio(datos.fuenteFinanciacion)) {
      throw new ReglaNegocioViolada('R06', 'Se requiere la fuente de financiación.');
    }
    if (vacio(datos.responsableId)) {
      throw new ReglaNegocioViolada('R06', 'Se requiere un responsable.');
    }
    politicaTipo.verificar(
      datos.tipoIntervencion,
      datos.referenciasEvaluacion.map((r) => r.nivelDano),
    );

    const proyecto = new ProyectoReconstruccion({
      id,
      version: 0,
      activo: true,
      desastreId: datos.desastreId,
      tipoIntervencion: datos.tipoIntervencion,
      estado: EstadoProyecto.Formulado,
      responsableId: datos.responsableId,
      creadoPor: datos.creadoPor,
      aprobadoPor: null,
      contratista: datos.contratista ?? null,
      referenciasEvaluacion: [...datos.referenciasEvaluacion],
      presupuesto: {
        valorVigente: datos.presupuesto,
        fuenteFinanciacion: datos.fuenteFinanciacion,
        costosEjecutados: Dinero.cero(),
      },
      cambiosPresupuesto: [],
      hitos: [],
      avances: [],
      costos: [],
      evidencias: [],
      historialEstados: [
        {
          anterior: null,
          nuevo: EstadoProyecto.Formulado,
          motivo: 'Creación',
          usuarioId: datos.creadoPor,
          fechaHora: ahora,
        },
      ],
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
    proyecto.emitir('ProyectoCreado', ahora, { desastreId: datos.desastreId, creadoPor: datos.creadoPor });
    return proyecto;
  }

  /** Sin validaciones ni eventos: lo usa el repositorio al leer. */
  static reconstituir(i: InstantaneaProyecto): ProyectoReconstruccion {
    return new ProyectoReconstruccion({
      ...i,
      referenciasEvaluacion: [...i.referenciasEvaluacion],
      cambiosPresupuesto: [...i.cambiosPresupuesto],
      hitos: [...i.hitos],
      avances: [...i.avances],
      costos: [...i.costos],
      evidencias: [...i.evidencias],
      historialEstados: [...i.historialEstados],
    });
  }

  // ------------------------------------------------------------ consultas

  get id(): string {
    return this.d.id;
  }
  get version(): number {
    return this.d.version;
  }
  get estado(): EstadoProyecto {
    return this.d.estado;
  }
  get desastreId(): string {
    return this.d.desastreId;
  }
  get responsableId(): string {
    return this.d.responsableId;
  }
  get creadoPor(): string {
    return this.d.creadoPor;
  }
  get activo(): boolean {
    return this.d.activo;
  }
  get referenciasEvaluacion(): readonly ReferenciaEvaluacion[] {
    return [...this.d.referenciasEvaluacion];
  }
  get valorVigente(): Dinero {
    return this.d.presupuesto.valorVigente;
  }
  get costosEjecutados(): Dinero {
    return this.d.presupuesto.costosEjecutados;
  }
  get hitos(): readonly Hito[] {
    return [...this.d.hitos];
  }
  get evidencias(): readonly Evidencia[] {
    return [...this.d.evidencias];
  }
  get cambiosPresupuesto(): readonly CambioPresupuesto[] {
    return [...this.d.cambiosPresupuesto];
  }

  avanceFisico(): Porcentaje {
    return this.d.avances.at(-1)?.avanceFisico ?? Porcentaje.CERO;
  }

  /** costosEjecutados / valorVigente × 100, redondeado a 2 decimales. */
  avanceFinanciero(): number {
    const { costosEjecutados, valorVigente } = this.d.presupuesto;
    if (!valorVigente.esPositivo()) return 0;
    const centesimas =
      (costosEjecutados.centavos * 20000n + valorVigente.centavos) / (valorVigente.centavos * 2n);
    return Number(centesimas) / 100;
  }

  estaAtrasado(hoy: FechaCalendario): boolean {
    if (!ESTADOS_ACTIVOS.includes(this.d.estado)) return false;
    return this.d.hitos.some((h) => h.fechaReal === null && h.fechaPlanificada.menorQue(hoy));
  }

  cambiosPendientes(): readonly CambioPresupuesto[] {
    return this.d.cambiosPresupuesto.filter((c) => c.estado === EstadoCambioPresupuesto.Pendiente);
  }

  extraerEventos(): EventoDominio[] {
    return this.eventos.splice(0);
  }

  aInstantanea(): InstantaneaProyecto {
    const d = this.d;
    return {
      ...d,
      referenciasEvaluacion: [...d.referenciasEvaluacion],
      cambiosPresupuesto: [...d.cambiosPresupuesto],
      hitos: [...d.hitos],
      avances: [...d.avances],
      costos: [...d.costos],
      evidencias: [...d.evidencias],
      historialEstados: [...d.historialEstados],
    };
  }

  // ------------------------------------------------------------ transiciones

  aprobar(usuarioId: string, ahora: Date): void {
    const nuevo = transiciones.verificar(this.d.estado, 'aprobar');
    if (usuarioId === this.d.creadoPor) {
      throw new ReglaNegocioViolada('R07', 'Quien aprueba el proyecto debe ser distinto de quien lo creó.');
    }
    this.d.aprobadoPor = usuarioId;
    this.cambiarEstado(nuevo, 'Aprobación', usuarioId, ahora);
    this.emitir('ProyectoAprobado', ahora, { usuarioId });
  }

  iniciarEjecucion(usuarioId: string, ahora: Date, contratista?: Contratista): void {
    this.verificarResponsable(usuarioId);
    const nuevo = transiciones.verificar(this.d.estado, 'iniciar');
    const contratistaFinal = contratista ?? this.d.contratista;
    if (!contratistaFinal || this.d.hitos.length === 0) {
      throw new ReglaNegocioViolada(
        'R08',
        'El proyecto necesita contratista y al menos un hito para iniciar la ejecución.',
      );
    }
    this.d.contratista = contratistaFinal;
    this.cambiarEstado(nuevo, 'Inicio de ejecución', usuarioId, ahora);
    this.emitir('EjecucionIniciada', ahora, { usuarioId });
  }

  suspender(motivo: string, usuarioId: string, ahora: Date): void {
    this.verificarResponsable(usuarioId);
    this.exigirMotivo(motivo);
    const nuevo = transiciones.verificar(this.d.estado, 'suspender');
    this.cambiarEstado(nuevo, motivo, usuarioId, ahora);
    this.emitir('ProyectoSuspendido', ahora, { usuarioId, motivo });
  }

  reanudar(motivo: string, usuarioId: string, ahora: Date): void {
    this.verificarResponsable(usuarioId);
    this.exigirMotivo(motivo);
    const nuevo = transiciones.verificar(this.d.estado, 'reanudar');
    this.cambiarEstado(nuevo, motivo, usuarioId, ahora);
    this.emitir('ProyectoReanudado', ahora, { usuarioId, motivo });
  }

  finalizar(usuarioId: string, ahora: Date): void {
    this.verificarResponsable(usuarioId);
    const nuevo = transiciones.verificar(this.d.estado, 'finalizar');
    if (!this.avanceFisico().esCien()) {
      throw new ReglaNegocioViolada('R09', 'Para finalizar el avance debe estar en 100 %.');
    }
    if (!this.d.evidencias.some((e) => e.tipo === TipoEvidencia.ENTREGA)) {
      throw new ReglaNegocioViolada('R09', 'Para finalizar debe existir una evidencia de entrega.');
    }
    if (this.cambiosPendientes().length > 0) {
      throw new ReglaNegocioViolada('C13', 'No se puede finalizar con cambios de presupuesto pendientes.');
    }
    this.d.activo = false;
    this.cambiarEstado(nuevo, 'Finalización', usuarioId, ahora);
    this.emitir('ProyectoFinalizado', ahora, { usuarioId });
  }

  cancelar(motivo: string, usuarioId: string, ahora: Date): void {
    this.exigirMotivo(motivo);
    const nuevo = transiciones.verificar(this.d.estado, 'cancelar');
    this.d.cambiosPresupuesto = this.d.cambiosPresupuesto.map((c) =>
      c.estado === EstadoCambioPresupuesto.Pendiente
        ? {
            ...c,
            estado: EstadoCambioPresupuesto.Anulado,
            resueltoEn: ahora,
            motivoResolucion: 'Proyecto cancelado',
          }
        : c,
    );
    this.d.activo = false;
    this.cambiarEstado(nuevo, motivo, usuarioId, ahora);
    this.emitir('ProyectoCancelado', ahora, { usuarioId, motivo });
  }

  // ------------------------------------------------------------- presupuesto

  solicitarCambioPresupuesto(
    valor: Dinero,
    motivo: string,
    usuarioId: string,
    politica: PoliticaAprobacionPresupuesto,
    ahora: Date,
    idCambio: string,
  ): CambioPresupuesto {
    this.verificarResponsable(usuarioId);
    this.verificarAceptaCambiosPresupuesto();
    if (vacio(motivo)) throw new ReglaNegocioViolada('R11', 'El cambio de presupuesto necesita un motivo.');
    this.verificarNuevoValor(valor);
    const vigente = this.d.presupuesto.valorVigente;
    const aplicar = !politica.requiereAprobacion(valor.restar(vigente));
    const cambio: CambioPresupuesto = {
      id: idCambio,
      valorAnterior: vigente,
      valorNuevo: valor,
      motivo,
      estado: aplicar ? EstadoCambioPresupuesto.Aplicado : EstadoCambioPresupuesto.Pendiente,
      solicitanteId: usuarioId,
      autorizanteId: null,
      solicitadoEn: ahora,
      resueltoEn: aplicar ? ahora : null,
      motivoResolucion: null,
    };
    this.d.cambiosPresupuesto = [...this.d.cambiosPresupuesto, cambio];
    this.emitir('CambioPresupuestoSolicitado', ahora, { cambioId: idCambio, estado: cambio.estado });
    if (aplicar) this.aplicarValor(valor, idCambio, ahora);
    this.d.actualizadoEn = ahora;
    return cambio;
  }

  resolverCambioPresupuesto(
    cambioId: string,
    decision: DecisionCambio,
    motivo: string | undefined,
    usuarioId: string,
    ahora: Date,
  ): CambioPresupuesto {
    this.verificarAceptaCambiosPresupuesto();
    const cambio = this.d.cambiosPresupuesto.find((c) => c.id === cambioId);
    if (!cambio) throw new NoEncontrado(`No existe el cambio de presupuesto ${cambioId}.`);
    if (cambio.estado !== EstadoCambioPresupuesto.Pendiente) {
      throw new ReglaNegocioViolada('R12', 'El cambio de presupuesto ya fue resuelto.');
    }
    if (usuarioId === cambio.solicitanteId) {
      throw new ReglaNegocioViolada(
        'C03',
        'Quien resuelve el cambio debe ser distinto de quien lo solicitó.',
      );
    }
    const aprobar = decision === 'APROBAR';
    if (aprobar) {
      if (!cambio.valorAnterior.igual(this.d.presupuesto.valorVigente)) {
        throw new CambioDesactualizado(
          'El presupuesto cambió desde la solicitud; debe solicitarse de nuevo.',
        );
      }
      this.verificarNuevoValor(cambio.valorNuevo);
    }
    const resuelto: CambioPresupuesto = {
      ...cambio,
      estado: aprobar ? EstadoCambioPresupuesto.Aprobado : EstadoCambioPresupuesto.Rechazado,
      autorizanteId: usuarioId,
      resueltoEn: ahora,
      motivoResolucion: motivo ?? null,
    };
    this.d.cambiosPresupuesto = this.d.cambiosPresupuesto.map((c) => (c.id === cambioId ? resuelto : c));
    if (aprobar) this.aplicarValor(cambio.valorNuevo, cambioId, ahora);
    else this.emitir('CambioPresupuestoRechazado', ahora, { cambioId, usuarioId });
    this.d.actualizadoEn = ahora;
    return resuelto;
  }

  // ----------------------------------------------------------- avance y costos

  registrarAvance(porcentaje: Porcentaje, usuarioId: string, ahora: Date): void {
    this.verificarResponsable(usuarioId);
    this.verificarNoSuspendido();
    if (this.d.estado !== EstadoProyecto.EnEjecucion) {
      throw new ReglaNegocioViolada('R14', 'El avance solo se registra con el proyecto en ejecución.');
    }
    if (porcentaje.menorQue(this.avanceFisico())) {
      throw new ReglaNegocioViolada('R14', 'El avance no puede bajar.');
    }
    this.d.avances = [...this.d.avances, { avanceFisico: porcentaje, usuarioId, fechaHora: ahora }];
    this.d.actualizadoEn = ahora;
    this.emitir('AvanceRegistrado', ahora, { porcentaje: porcentaje.valor, usuarioId });
  }

  registrarCosto(valor: Dinero, concepto: string, usuarioId: string, ahora: Date, idCosto: string): void {
    this.verificarResponsable(usuarioId);
    this.verificarNoSuspendido();
    if (this.d.estado !== EstadoProyecto.EnEjecucion) {
      throw new ReglaNegocioViolada('C11', 'Los costos solo se registran con el proyecto en ejecución.');
    }
    if (!valor.esPositivo())
      throw new ReglaNegocioViolada('C11', 'El valor del costo debe ser mayor que cero.');
    if (vacio(concepto)) throw new ReglaNegocioViolada('C11', 'El costo necesita un concepto.');
    const total = this.d.presupuesto.costosEjecutados.sumar(valor);
    if (total.mayorQue(this.d.presupuesto.valorVigente)) {
      throw new ReglaNegocioViolada(
        'R13',
        'Los costos registrados no pueden superar el presupuesto del proyecto.',
      );
    }
    this.d.costos = [...this.d.costos, { id: idCosto, valor, concepto, usuarioId, fechaHora: ahora }];
    this.d.presupuesto = { ...this.d.presupuesto, costosEjecutados: total };
    this.d.actualizadoEn = ahora;
    this.emitir('CostoRegistrado', ahora, { costoId: idCosto, valor: valor.aTextoPesos(), usuarioId });
  }

  // ------------------------------------------------------------------- hitos

  agregarHito(
    nombre: string,
    fechaPlanificada: FechaCalendario,
    usuarioId: string,
    idHito: string,
    ahora: Date,
  ): void {
    this.verificarEdicionHitos(usuarioId);
    if (vacio(nombre)) throw new ReglaNegocioViolada('C08', 'El hito necesita un nombre.');
    this.d.hitos = [...this.d.hitos, new Hito(idHito, nombre, fechaPlanificada)];
    this.hitoActualizado(ahora, idHito, 'AGREGADO');
  }

  editarHito(
    hitoId: string,
    cambios: { nombre?: string | undefined; fechaPlanificada?: FechaCalendario | undefined },
    usuarioId: string,
    ahora: Date,
  ): void {
    this.verificarEdicionHitos(usuarioId);
    const h = this.buscarHito(hitoId);
    if (cambios.nombre !== undefined && vacio(cambios.nombre)) {
      throw new ReglaNegocioViolada('C08', 'El hito necesita un nombre.');
    }
    const nuevo = new Hito(
      h.id,
      cambios.nombre ?? h.nombre,
      cambios.fechaPlanificada ?? h.fechaPlanificada,
      h.fechaReal,
    );
    this.d.hitos = this.d.hitos.map((x) => (x.id === hitoId ? nuevo : x));
    this.hitoActualizado(ahora, hitoId, 'EDITADO');
  }

  eliminarHito(hitoId: string, usuarioId: string, ahora: Date): void {
    this.verificarEdicionHitos(usuarioId);
    this.buscarHito(hitoId);
    this.d.hitos = this.d.hitos.filter((x) => x.id !== hitoId);
    this.hitoActualizado(ahora, hitoId, 'ELIMINADO');
  }

  registrarFechaRealHito(hitoId: string, fechaReal: FechaCalendario, usuarioId: string, ahora: Date): void {
    this.verificarResponsable(usuarioId);
    if (this.d.estado !== EstadoProyecto.EnEjecucion) {
      throw new ReglaNegocioViolada(
        'C08',
        'La fecha real de un hito solo se registra con el proyecto en ejecución.',
      );
    }
    const h = this.buscarHito(hitoId);
    this.d.hitos = this.d.hitos.map((x) =>
      x.id === hitoId ? new Hito(h.id, h.nombre, h.fechaPlanificada, fechaReal) : x,
    );
    this.hitoActualizado(ahora, hitoId, 'FECHA_REAL');
  }

  // --------------------------------------------------------------- evidencias

  verificarPuedeAdjuntarEvidencia(usuarioId: string): void {
    this.verificarResponsable(usuarioId);
    if (this.d.estado !== EstadoProyecto.EnEjecucion) {
      throw new ReglaNegocioViolada('C09', 'Las evidencias solo se adjuntan con el proyecto en ejecución.');
    }
  }

  /** Valida tipo, mime y tamaño antes de guardar el archivo (C09). */
  verificarDatosEvidencia(tipo: string, tipoMime: string, tamanoBytes: number): void {
    if (!Object.values(TipoEvidencia).includes(tipo as TipoEvidencia)) {
      throw new ReglaNegocioViolada('C09', `Tipo de evidencia inválido: ${tipo}.`);
    }
    if (!MIMES_PERMITIDOS.includes(tipoMime)) {
      throw new ReglaNegocioViolada('C09', 'Solo se aceptan archivos PDF, JPG o PNG.');
    }
    if (tamanoBytes > MAX_BYTES_EVIDENCIA) {
      throw new ReglaNegocioViolada('C09', 'El archivo no puede superar 10 MB.');
    }
  }

  adjuntarEvidencia(datos: DatosEvidencia, ahora: Date): void {
    this.verificarPuedeAdjuntarEvidencia(datos.autorId);
    this.verificarDatosEvidencia(datos.tipo, datos.tipoMime, datos.tamanoBytes);
    this.d.evidencias = [...this.d.evidencias, { ...datos, fechaHora: ahora }];
    this.d.actualizadoEn = ahora;
    this.emitir('EvidenciaAdjuntada', ahora, { evidenciaId: datos.id, tipo: datos.tipo });
  }

  // ------------------------------------------------------------------ privados

  private emitir(tipo: TipoEventoProyecto, ahora: Date, datos: Record<string, unknown> = {}): void {
    this.eventos.push(eventoProyecto(tipo, this.d.id, ahora, datos));
  }

  private cambiarEstado(nuevo: EstadoProyecto, motivo: string, usuarioId: string, ahora: Date): void {
    this.d.historialEstados = [
      ...this.d.historialEstados,
      { anterior: this.d.estado, nuevo, motivo, usuarioId, fechaHora: ahora },
    ];
    this.d.estado = nuevo;
    this.d.actualizadoEn = ahora;
  }

  private verificarResponsable(usuarioId: string): void {
    if (usuarioId !== this.d.responsableId) {
      throw new NoAutorizado('Solo el responsable asignado puede realizar esta operación.', 'C10');
    }
  }

  private exigirMotivo(motivo: string): void {
    if (vacio(motivo)) throw new ReglaNegocioViolada('C14', 'Se requiere un motivo.');
  }

  private verificarNoSuspendido(): void {
    if (this.d.estado === EstadoProyecto.Suspendido) {
      throw new ReglaNegocioViolada('R15', 'Un proyecto suspendido no recibe avances ni costos.');
    }
  }

  private verificarAceptaCambiosPresupuesto(): void {
    const e = this.d.estado;
    if (
      e === EstadoProyecto.Suspendido ||
      e === EstadoProyecto.Finalizado ||
      e === EstadoProyecto.Cancelado
    ) {
      throw new ReglaNegocioViolada('C04', `Un proyecto ${e} no acepta cambios de presupuesto.`);
    }
  }

  private verificarNuevoValor(valor: Dinero): void {
    if (!valor.esPositivo())
      throw new ReglaNegocioViolada('C02', 'El nuevo presupuesto debe ser mayor que cero.');
    if (valor.menorQue(this.d.presupuesto.costosEjecutados)) {
      throw new ReglaNegocioViolada(
        'C02',
        'El nuevo presupuesto no puede ser menor que los costos ejecutados.',
      );
    }
  }

  private aplicarValor(valor: Dinero, cambioId: string, ahora: Date): void {
    this.d.presupuesto = { ...this.d.presupuesto, valorVigente: valor };
    this.emitir('CambioPresupuestoAplicado', ahora, { cambioId, valorVigente: valor.aTextoPesos() });
  }

  private verificarEdicionHitos(usuarioId: string): void {
    this.verificarResponsable(usuarioId);
    if (this.d.estado !== EstadoProyecto.Formulado && this.d.estado !== EstadoProyecto.Aprobado) {
      throw new ReglaNegocioViolada(
        'C08',
        'Los hitos solo se agregan, editan o eliminan en Formulado o Aprobado.',
      );
    }
  }

  private buscarHito(hitoId: string): Hito {
    const h = this.d.hitos.find((x) => x.id === hitoId);
    if (!h) throw new NoEncontrado(`No existe el hito ${hitoId}.`);
    return h;
  }

  private hitoActualizado(ahora: Date, hitoId: string, accion: string): void {
    this.d.actualizadoEn = ahora;
    this.emitir('HitoActualizado', ahora, { hitoId, accion });
  }
}

type Mutable = { -readonly [K in keyof InstantaneaProyecto]: InstantaneaProyecto[K] };

export type { AccionProyecto };
