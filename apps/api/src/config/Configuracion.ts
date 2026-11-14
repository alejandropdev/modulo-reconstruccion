import { z } from 'zod';

const Esquema = z.object({
  MONGO_URI: z.string().default('mongodb://localhost:27017/reconstruccion?replicaSet=rs0'),
  NOMBRE_BD: z.string().default('reconstruccion'),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRA_EN: z.string().default('8h'),
  UMBRAL_CAMBIO_PRESUPUESTO: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .default('50000000'),
  URL_MODULOS_EXTERNOS: z.string().default('http://localhost:3001'),
  PUERTO_API: z.coerce.number().default(3000),
});

export type Configuracion = z.infer<typeof Esquema>;

/** Lee y valida las variables de entorno al arrancar; si falta algo, el proceso termina con un mensaje claro. */
export function leerConfiguracion(env: NodeJS.ProcessEnv = process.env): Configuracion {
  const r = Esquema.safeParse(env);
  if (!r.success) {
    throw new Error(
      `Configuración inválida: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return r.data;
}
