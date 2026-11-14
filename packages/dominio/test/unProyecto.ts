import {
  Dinero,
  FechaCalendario,
  Porcentaje,
  PoliticaTipoIntervencion,
  ProyectoReconstruccion,
  TipoEvidencia,
  type EstadoProyecto,
  type ReferenciaEvaluacion,
} from '../src/index.js';

export const U = { autoridad: 'u-aut', aprobador: 'u-apr', responsable: 'u-resp', otro: 'u-otro' } as const;
export const AHORA = new Date('2026-03-01T10:00:00Z');
export const HOY = FechaCalendario.desde('2026-03-01');
export const politicaTipo = new PoliticaTipoIntervencion();

/** Builder de pruebas: `unProyecto().enEstado('EnEjecucion').conHito().build()`. */
export function unProyecto(): ConstructorProyecto {
  return new ConstructorProyecto();
}

class ConstructorProyecto {
  private estado: EstadoProyecto = 'Formulado';
  private hitos: string[] = [];
  private contratista = true;
  private presupuesto = '1000000000';
  private avance = 0;
  private entrega = false;
  private referencias: ReferenciaEvaluacion[] = [
    { evaluacionId: 'E-1', activoId: 'A-1', nivelDano: 'SEVERO' },
  ];

  enEstado(estado: EstadoProyecto): this {
    this.estado = estado;
    return this;
  }
  conHito(fechaPlanificada = '2026-06-01'): this {
    this.hitos.push(fechaPlanificada);
    return this;
  }
  sinContratista(): this {
    this.contratista = false;
    return this;
  }
  conPresupuesto(pesos: string): this {
    this.presupuesto = pesos;
    return this;
  }
  conAvance(porcentaje: number): this {
    this.avance = porcentaje;
    return this;
  }
  conEvidenciaEntrega(): this {
    this.entrega = true;
    return this;
  }
  conReferencias(r: ReferenciaEvaluacion[]): this {
    this.referencias = r;
    return this;
  }

  build(): ProyectoReconstruccion {
    const p = ProyectoReconstruccion.crear(
      {
        desastreId: 'D-002',
        tipoIntervencion: 'RECONSTRUCCION',
        referenciasEvaluacion: this.referencias,
        presupuesto: Dinero.desde(this.presupuesto),
        fuenteFinanciacion: 'SGR',
        responsableId: U.responsable,
        creadoPor: U.autoridad,
        ...(this.contratista ? { contratista: { nit: '900123456-7', nombre: 'Constructora X' } } : {}),
      },
      politicaTipo,
      AHORA,
      'P-1',
    );
    this.hitos.forEach((f, i) =>
      p.agregarHito(`Hito ${i + 1}`, FechaCalendario.desde(f), U.responsable, `H-${i + 1}`, AHORA),
    );
    if (this.estado === 'Formulado') return limpio(p);
    if (this.estado === 'Cancelado') {
      p.cancelar('Prueba', U.autoridad, AHORA);
      return limpio(p);
    }
    p.aprobar(U.aprobador, AHORA);
    if (this.estado === 'Aprobado') return limpio(p);
    p.iniciarEjecucion(U.responsable, AHORA);
    if (this.avance > 0) p.registrarAvance(Porcentaje.desde(this.avance), U.responsable, AHORA);
    if (this.entrega || this.estado === 'Finalizado') {
      p.adjuntarEvidencia(
        {
          id: 'EV-1',
          tipo: TipoEvidencia.ENTREGA,
          autorId: U.responsable,
          archivoId: 'f1',
          nombreArchivo: 'acta.pdf',
          tipoMime: 'application/pdf',
          tamanoBytes: 1000,
        },
        AHORA,
      );
    }
    if (this.estado === 'Suspendido') p.suspender('Prueba', U.responsable, AHORA);
    if (this.estado === 'Finalizado') {
      p.registrarAvance(Porcentaje.desde(100), U.responsable, AHORA);
      p.finalizar(U.responsable, AHORA);
    }
    return limpio(p);
  }
}

function limpio(p: ProyectoReconstruccion): ProyectoReconstruccion {
  p.extraerEventos();
  return p;
}
