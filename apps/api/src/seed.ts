import { hash } from '@node-rs/argon2';
import { Dinero } from '@reconstruccion/dominio';
import { conectarMongo, crearIndices, ParametrosNegocioMongo } from '@reconstruccion/infraestructura';
import { leerConfiguracion } from './config/Configuracion.js';

const CLAVE = 'Clave123*';
const USUARIOS = [
  { _id: 'u-autoridad', nombre: 'Autoridad', correo: 'autoridad@reconstruccion.dev', roles: ['AUTORIDAD'] },
  {
    _id: 'u-aprobador1',
    nombre: 'Aprobador 1',
    correo: 'aprobador1@reconstruccion.dev',
    roles: ['APROBADOR'],
  },
  {
    _id: 'u-aprobador2',
    nombre: 'Aprobador 2',
    correo: 'aprobador2@reconstruccion.dev',
    roles: ['APROBADOR'],
  },
  {
    _id: 'u-responsable1',
    nombre: 'Responsable 1',
    correo: 'responsable1@reconstruccion.dev',
    roles: ['RESPONSABLE'],
  },
  {
    _id: 'u-responsable2',
    nombre: 'Responsable 2',
    correo: 'responsable2@reconstruccion.dev',
    roles: ['RESPONSABLE'],
  },
  {
    _id: 'u-autoridad-aprobadora',
    nombre: 'Autoridad Aprobadora',
    correo: 'autoridad.aprobadora@reconstruccion.dev',
    roles: ['AUTORIDAD', 'APROBADOR'],
  },
];

/** Idempotente: crea índices, el parámetro de umbral y los usuarios de desarrollo (no pisa lo existente). */
const config = leerConfiguracion();
const { cliente, db } = await conectarMongo(config.MONGO_URI, config.NOMBRE_BD);
await crearIndices(db);
await new ParametrosNegocioMongo(db, Dinero.desde(config.UMBRAL_CAMBIO_PRESUPUESTO)).sembrar();
const hashContrasena = await hash(CLAVE);
for (const u of USUARIOS) {
  await db
    .collection<{ _id: string }>('usuarios')
    .updateOne({ _id: u._id }, { $setOnInsert: { ...u, hashContrasena, activo: true } }, { upsert: true });
}
console.log(`Seed listo: ${USUARIOS.length} usuarios, índices y parámetros.`);
await cliente.close();
