import type { FiltrosProyectos, Pagina, RepositorioProyectos } from '@reconstruccion/aplicacion';
import {
  ConflictoConcurrencia,
  EvaluacionEnProyectoActivo,
  ProyectoReconstruccion,
} from '@reconstruccion/dominio';
import { MongoServerError, type Collection, type Db, type Filter } from 'mongodb';
import { opciones } from './ContextoSesion.js';
import type { DocumentoProyecto } from './DocumentoProyecto.js';
import { aDocumento, aInstantanea } from './MapperProyecto.js';

const ESTADOS_ACTIVOS = ['Formulado', 'Aprobado', 'EnEjecucion', 'Suspendido'];

export class RepositorioProyectosMongo implements RepositorioProyectos {
  private readonly coleccion: Collection<DocumentoProyecto>;

  constructor(db: Db) {
    this.coleccion = db.collection<DocumentoProyecto>('proyectos');
  }

  async obtener(id: string): Promise<ProyectoReconstruccion | null> {
    const doc = await this.coleccion.findOne({ _id: id }, opciones());
    return doc ? ProyectoReconstruccion.reconstituir(aInstantanea(doc)) : null;
  }

  async guardar(proyecto: ProyectoReconstruccion): Promise<void> {
    const instantanea = proyecto.aInstantanea();
    const doc = aDocumento({ ...instantanea, version: instantanea.version + 1 });
    try {
      if (instantanea.version === 0) {
        await this.coleccion.insertOne(doc, opciones());
        return;
      }
      const r = await this.coleccion.replaceOne(
        { _id: doc._id, version: instantanea.version },
        doc,
        opciones(),
      );
      if (r.matchedCount === 0) {
        throw new ConflictoConcurrencia(`El proyecto ${doc._id} fue modificado por otra operación.`);
      }
    } catch (e) {
      // R05 ante concurrencia: viola el índice único parcial de evaluaciones en proyectos activos.
      if (
        e instanceof MongoServerError &&
        e.code === 11000 &&
        JSON.stringify(e.keyPattern ?? {}).includes('evaluacionId')
      ) {
        throw new EvaluacionEnProyectoActivo('Una de las evaluaciones ya está en un proyecto activo.');
      }
      throw e;
    }
  }

  async buscar(
    filtros: FiltrosProyectos,
    pagina: Pagina,
  ): Promise<{ items: ProyectoReconstruccion[]; total: number }> {
    const filtro: Filter<DocumentoProyecto> = {};
    if (filtros.desastreId) filtro.desastreId = filtros.desastreId;
    if (filtros.estado) filtro.estado = filtros.estado;
    if (filtros.responsableId) filtro.responsableId = filtros.responsableId;
    if (filtros.atrasadoAntesDe) {
      filtro.estado = { $in: ESTADOS_ACTIVOS };
      filtro.hitos = {
        $elemMatch: {
          fechaReal: null,
          fechaPlanificada: { $lt: new Date(`${filtros.atrasadoAntesDe.texto}T00:00:00.000Z`) },
        },
      };
    }
    const [docs, total] = await Promise.all([
      this.coleccion
        .find(filtro, opciones())
        .sort({ creadoEn: -1, _id: 1 })
        .skip((pagina.pagina - 1) * pagina.tamano)
        .limit(pagina.tamano)
        .toArray(),
      this.coleccion.countDocuments(filtro, opciones()),
    ]);
    return { items: docs.map((d) => ProyectoReconstruccion.reconstituir(aInstantanea(d))), total };
  }

  async listarPorDesastre(desastreId: string): Promise<ProyectoReconstruccion[]> {
    const docs = await this.coleccion.find({ desastreId }, opciones()).toArray();
    return docs.map((d) => ProyectoReconstruccion.reconstituir(aInstantanea(d)));
  }

  async evaluacionesEnProyectosActivos(evaluacionIds: readonly string[]): Promise<string[]> {
    const docs = await this.coleccion
      .find({ activo: true, 'referenciasEvaluacion.evaluacionId': { $in: [...evaluacionIds] } }, opciones())
      .project<Pick<DocumentoProyecto, 'referenciasEvaluacion'>>({ referenciasEvaluacion: 1 })
      .toArray();
    const usadas = new Set(docs.flatMap((d) => d.referenciasEvaluacion.map((r) => r.evaluacionId)));
    return evaluacionIds.filter((id) => usadas.has(id));
  }
}
