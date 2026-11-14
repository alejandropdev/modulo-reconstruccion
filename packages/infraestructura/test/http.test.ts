import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ActualizacionEstadoDesastreHttp,
  ClienteHttp,
  ConsultaDesastresHttp,
  ConsultaEvaluacionesHttp,
} from '../src/index.js';

let servidor: Server;
let url: string;
const llamadas: string[] = [];

beforeAll(async () => {
  servidor = createServer((req, res) => {
    llamadas.push(`${req.method} ${req.url}`);
    const responder = (codigo: number, cuerpo: unknown) => {
      res.writeHead(codigo, { 'content-type': 'application/json' });
      res.end(JSON.stringify(cuerpo));
    };
    if (req.url === '/desastres/D-1') return responder(200, { id: 'D-1', estado: 'RECONSTRUCCION' });
    if (req.url === '/desastres/D-404') return responder(404, {});
    if (req.url === '/desastres') return responder(200, [{ id: 'D-1' }]);
    if (req.url?.startsWith('/evaluaciones')) return responder(200, [{ id: 'E-1' }]);
    if (req.method === 'PATCH' && req.url === '/desastres/D-1/estado')
      return responder(200, { id: 'D-1', estado: 'CERRADO' });
    if (req.url === '/desastres/D-500') return responder(500, {});
    if (req.url === '/desastres/D-lento') return void setTimeout(() => responder(200, {}), 500);
    responder(404, {});
  });
  await new Promise<void>((ok) => servidor.listen(0, ok));
  url = `http://localhost:${(servidor.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((ok) => servidor.close(() => ok())));

describe('clientes HTTP de otros módulos', () => {
  const http = () => new ClienteHttp(url, 200);

  it('ConsultaDesastresHttp: obtiene, lista y devuelve null si es 404', async () => {
    const c = new ConsultaDesastresHttp(http());
    expect(await c.obtener('D-1')).toMatchObject({ id: 'D-1' });
    expect(await c.obtener('D-404')).toBeNull();
    expect(await c.listar()).toHaveLength(1);
  });

  it('ConsultaEvaluacionesHttp: arma las consultas por ids y por desastre', async () => {
    const c = new ConsultaEvaluacionesHttp(http());
    await c.obtenerVarias(['E-1', 'E-2']);
    await c.listarPorDesastre('D-2');
    expect(llamadas).toContain('GET /evaluaciones?ids=E-1,E-2');
    expect(llamadas).toContain('GET /evaluaciones?desastreId=D-2');
    expect(await c.obtenerVarias([])).toEqual([]);
  });

  it('ActualizacionEstadoDesastreHttp: cambia el estado y traduce 404 a NO_ENCONTRADO', async () => {
    const c = new ActualizacionEstadoDesastreHttp(http());
    await c.cambiarEstado('D-1', 'CERRADO');
    await expect(c.cambiarEstado('D-404', 'CERRADO')).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });

  it('SERVICIO_EXTERNO_NO_DISPONIBLE: 5xx, timeout y servidor caído', async () => {
    const c = new ConsultaDesastresHttp(http());
    await expect(c.obtener('D-500')).rejects.toMatchObject({ codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE' });
    await expect(c.obtener('D-lento')).rejects.toMatchObject({ codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE' });
    await expect(
      new ConsultaDesastresHttp(new ClienteHttp('http://localhost:1', 200)).listar(),
    ).rejects.toMatchObject({
      codigo: 'SERVICIO_EXTERNO_NO_DISPONIBLE',
    });
  });
});
