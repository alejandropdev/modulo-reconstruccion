import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ErrorApi } from '@reconstruccion/contratos';
import { z } from 'zod';

/** JSON Schema para OpenAPI: sin la clave `$schema`, que no forma parte de un objeto de esquema de OpenAPI. */
const aJson = (esquema: z.ZodType, io: 'input' | 'output' = 'output'): object => {
  const { $schema: _ignorado, ...resto } = z.toJSONSchema(esquema, { io }) as Record<string, unknown>;
  return resto;
};

interface OpcionesDocumentacion {
  /** Esquema del cuerpo JSON de entrada. */
  readonly entrada?: z.ZodType;
  /** Esquema del cuerpo de la respuesta exitosa. */
  readonly salida: z.ZodType;
  /** `true` si la ruta responde 201 (por defecto 200). */
  readonly creado?: boolean;
  /** Descripción de la respuesta exitosa. */
  readonly descripcion: string;
  /** Esquema de los parámetros de consulta (query string). */
  readonly consulta?: z.ZodObject;
}

/** Documenta en Swagger la entrada y la salida de una ruta con los esquemas zod de `@reconstruccion/contratos`. */
export function documentar(o: OpcionesDocumentacion): MethodDecorator {
  const respuesta = { description: o.descripcion, schema: aJson(o.salida) };
  const decoradores: MethodDecorator[] = [o.creado ? ApiCreatedResponse(respuesta) : ApiOkResponse(respuesta)];
  if (o.entrada) decoradores.push(ApiBody({ schema: aJson(o.entrada, 'input') }));
  if (o.consulta) {
    const propiedades = (aJson(o.consulta, 'input') as { properties?: Record<string, object> }).properties ?? {};
    for (const [name, schema] of Object.entries(propiedades)) {
      decoradores.push(ApiQuery({ name, required: false, schema }));
    }
  }
  return applyDecorators(...decoradores);
}

/** Documenta una descarga binaria (respuesta 200 con el contenido del archivo). */
export function documentarDescarga(descripcion: string): MethodDecorator {
  return ApiOkResponse({
    description: descripcion,
    content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
  });
}

/** Documenta la subida multipart de una evidencia (campos `archivo` y `tipo`). */
export function documentarSubida(tipos: readonly string[]): MethodDecorator {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['archivo', 'tipo'],
        properties: {
          archivo: { type: 'string', format: 'binary', description: 'PDF, JPG o PNG de hasta 10 MB.' },
          tipo: { type: 'string', enum: [...tipos] },
        },
      },
    }),
  );
}

const ERRORES: readonly (readonly [number, string])[] = [
  [400, 'Datos de entrada inválidos (`DATOS_INVALIDOS`).'],
  [401, 'Falta el token o no es válido.'],
  [403, 'El usuario no tiene el rol requerido (`NO_AUTORIZADO`).'],
  [404, 'El recurso no existe (`NO_ENCONTRADO`).'],
  [409, 'Conflicto: `EVALUACION_EN_PROYECTO_ACTIVO`, `CAMBIO_DESACTUALIZADO` o `CONFLICTO_CONCURRENCIA`.'],
  [422, 'Regla de negocio violada (`REGLA_NEGOCIO` o `TRANSICION_INVALIDA`); el campo `regla` trae el código (R01…, C01…).'],
  [503, 'Otro módulo no está disponible (`SERVICIO_EXTERNO_NO_DISPONIBLE`).'],
];

/** Documenta, a nivel de controlador, el formato de error común del catálogo de errores. */
export function documentarErrores(): ClassDecorator {
  const schema = aJson(ErrorApi);
  return applyDecorators(...ERRORES.map(([status, description]) => ApiResponse({ status, description, schema })));
}
