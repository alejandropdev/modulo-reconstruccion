import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { beforeAll, describe, expect, it } from 'vitest';
import { AuthController } from '../src/auth/AuthController.js';
import { ServicioAuth } from '../src/auth/ServicioAuth.js';
import { DesastresController } from '../src/desastres/DesastresController.js';
import { ProyectosController } from '../src/proyectos/ProyectosController.js';
import { SaludController } from '../src/SaludController.js';
import { CASOS_DESASTRES, CASOS_PROYECTOS } from '../src/tokens.js';

// Los controladores se montan con dependencias vacías: solo interesa lo que declaran para Swagger.
@Module({
  controllers: [SaludController, AuthController, ProyectosController, DesastresController],
  providers: [
    { provide: ServicioAuth, useValue: {} },
    { provide: CASOS_PROYECTOS, useValue: {} },
    { provide: CASOS_DESASTRES, useValue: {} },
  ],
})
class ModuloDocumentacion {}

const METODOS = ['get', 'post', 'patch', 'put', 'delete'] as const;
const RUTAS_PUBLICAS = new Set(['/api/v1/salud', '/api/v1/auth/login']);

interface Operacion {
  readonly ruta: string;
  readonly metodo: string;
  readonly operacion: {
    responses?: Record<string, { content?: Record<string, unknown> }>;
  };
}

describe('Documentación Swagger de la API', () => {
  let documento: OpenAPIObject;
  let operaciones: Operacion[];

  beforeAll(async () => {
    const app = await NestFactory.create(ModuloDocumentacion, { logger: false });
    app.setGlobalPrefix('api/v1');
    documento = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('prueba').build());
    await app.close();
    operaciones = Object.entries(documento.paths).flatMap(([ruta, item]) =>
      METODOS.filter((m) => item[m]).map((metodo) => ({ ruta, metodo, operacion: item[metodo] as Operacion['operacion'] })),
    );
  });

  it('documenta las 25 rutas de la API', () => {
    expect(operaciones).toHaveLength(25);
  });

  it('toda ruta documenta el cuerpo de su respuesta exitosa', () => {
    const sinRespuesta = operaciones
      .filter(({ operacion }) => {
        const exitosas = Object.entries(operacion.responses ?? {}).filter(([codigo]) => codigo.startsWith('2'));
        return !exitosas.some(([, r]) => r.content && Object.keys(r.content).length > 0);
      })
      .map(({ metodo, ruta }) => `${metodo.toUpperCase()} ${ruta}`);
    expect(sinRespuesta).toEqual([]);
  });

  it('toda ruta protegida documenta el formato de error (401, 403, 404, 422)', () => {
    const incompletas = operaciones
      .filter(({ ruta }) => !RUTAS_PUBLICAS.has(ruta))
      .filter(({ operacion }) => ![401, 403, 404, 422].every((c) => operacion.responses?.[String(c)]?.content))
      .map(({ metodo, ruta }) => `${metodo.toUpperCase()} ${ruta}`);
    expect(incompletas).toEqual([]);
  });

  it('POST /proyectos documenta que devuelve el proyectoId con estado 201', () => {
    const respuesta = documento.paths['/api/v1/proyectos']?.post?.responses?.['201'] as
      | { content?: { 'application/json'?: { schema?: { properties?: Record<string, unknown> } } } }
      | undefined;
    expect(Object.keys(respuesta?.content?.['application/json']?.schema?.properties ?? {})).toEqual(['proyectoId']);
  });
});
