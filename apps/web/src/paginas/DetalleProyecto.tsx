import {
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Loader,
  NumberInput,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CrearHitoEntrada,
  RegistrarCostoEntrada,
  SolicitarCambioPresupuestoEntrada,
  TipoEvidencia,
  type DetalleProyectoSalida,
} from '@reconstruccion/contratos';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { api } from '../api/cliente';
import { mostrarError, useAccion, useProyecto } from '../api/hooks';
import { useSesion } from '../auth/Sesion';
import { fechaHora, pesos } from '../componentes/Dinero';
import { ModalMotivo } from '../componentes/ModalMotivo';

type Proyecto = DetalleProyectoSalida;
const FINALES = ['Finalizado', 'Cancelado'];

export function DetalleProyecto() {
  const { id = '' } = useParams();
  const { data: p, isLoading, error } = useProyecto(id);
  if (isLoading) return <Loader />;
  if (error || !p) return <Alert color="red">No se pudo cargar el proyecto.</Alert>;
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Proyecto {p.id.slice(0, 8)}</Title>
        <Group>
          <Badge size="lg">{p.estado}</Badge>
          {p.estaAtrasado && (
            <Badge size="lg" color="red">
              Atrasado
            </Badge>
          )}
        </Group>
      </Group>
      <Acciones p={p} />
      <Tabs defaultValue="resumen">
        <Tabs.List>
          {['resumen', 'hitos', 'avances', 'costos', 'presupuesto', 'evidencias', 'historial'].map((t) => (
            <Tabs.Tab key={t} value={t} style={{ textTransform: 'capitalize' }}>
              {t}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value="resumen" pt="md">
          <Resumen p={p} />
        </Tabs.Panel>
        <Tabs.Panel value="hitos" pt="md">
          <Hitos p={p} />
        </Tabs.Panel>
        <Tabs.Panel value="avances" pt="md">
          <Avances p={p} />
        </Tabs.Panel>
        <Tabs.Panel value="costos" pt="md">
          <Costos p={p} />
        </Tabs.Panel>
        <Tabs.Panel value="presupuesto" pt="md">
          <Presupuesto p={p} />
        </Tabs.Panel>
        <Tabs.Panel value="evidencias" pt="md">
          <Evidencias p={p} />
        </Tabs.Panel>
        <Tabs.Panel value="historial" pt="md">
          <Historial p={p} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

/** Los botones se muestran según rol, estado y si el usuario es el responsable asignado. */
function Acciones({ p }: { p: Proyecto }) {
  const { usuario, tieneRol } = useSesion();
  const [modal, setModal] = useState<'suspender' | 'reanudar' | 'cancelar' | null>(null);
  const sinCuerpo = (accion: string) => useAccion(() => api.post(`/proyectos/${p.id}/${accion}`), 'Hecho');
  const aprobar = sinCuerpo('aprobar');
  const iniciar = sinCuerpo('iniciar');
  const finalizar = sinCuerpo('finalizar');
  const conMotivo = useAccion(
    ({ accion, motivo }: { accion: string; motivo: string }) =>
      api.post(`/proyectos/${p.id}/${accion}`, { motivo }),
    'Hecho',
  );
  const esResponsable = tieneRol('RESPONSABLE') && usuario?.id === p.responsableId;

  return (
    <Group>
      {tieneRol('APROBADOR') && p.estado === 'Formulado' && usuario?.id !== p.creadoPor && (
        <Button loading={aprobar.isPending} onClick={() => aprobar.mutate(undefined)}>
          Aprobar
        </Button>
      )}
      {esResponsable && p.estado === 'Aprobado' && (
        <Button loading={iniciar.isPending} onClick={() => iniciar.mutate(undefined)}>
          Iniciar ejecución
        </Button>
      )}
      {esResponsable && p.estado === 'EnEjecucion' && (
        <Button color="orange" onClick={() => setModal('suspender')}>
          Suspender
        </Button>
      )}
      {esResponsable && p.estado === 'Suspendido' && (
        <Button onClick={() => setModal('reanudar')}>Reanudar</Button>
      )}
      {esResponsable && p.estado === 'EnEjecucion' && (
        <Button color="green" loading={finalizar.isPending} onClick={() => finalizar.mutate(undefined)}>
          Finalizar
        </Button>
      )}
      {tieneRol('AUTORIDAD') && !FINALES.includes(p.estado) && (
        <Button color="red" variant="outline" onClick={() => setModal('cancelar')}>
          Cancelar proyecto
        </Button>
      )}
      <ModalMotivo
        titulo={modal ? `Motivo para ${modal}` : ''}
        abierto={modal !== null}
        alCerrar={() => setModal(null)}
        cargando={conMotivo.isPending}
        alConfirmar={(motivo) =>
          modal && conMotivo.mutate({ accion: modal, motivo }, { onSuccess: () => setModal(null) })
        }
      />
    </Group>
  );
}

function Resumen({ p }: { p: Proyecto }) {
  const dato = (titulo: string, valor: string) => (
    <div>
      <Text size="xs" c="dimmed">
        {titulo}
      </Text>
      <Text>{valor}</Text>
    </div>
  );
  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {dato('Desastre', p.desastreId)}
        {dato('Tipo de intervención', p.tipoIntervencion)}
        {dato('Responsable', p.responsableId)}
        {dato('Creado por', p.creadoPor)}
        {dato('Aprobado por', p.aprobadoPor ?? '—')}
        {dato('Contratista', p.contratista ? `${p.contratista.nombre} (${p.contratista.nit})` : '—')}
        {dato('Presupuesto vigente', pesos(p.presupuesto.valorVigente))}
        {dato('Fuente de financiación', p.presupuesto.fuenteFinanciacion)}
        {dato('Costos ejecutados', pesos(p.presupuesto.costosEjecutados))}
      </SimpleGrid>
      <div>
        <Text size="sm">Avance físico: {p.avanceFisico} %</Text>
        <Progress value={p.avanceFisico} />
      </div>
      <div>
        <Text size="sm">Avance financiero: {p.avanceFinanciero} %</Text>
        <Progress value={p.avanceFinanciero} color="teal" />
      </div>
      <Text size="sm" fw={500}>
        Evaluaciones de origen
      </Text>
      <Table>
        <Table.Tbody>
          {p.referenciasEvaluacion.map((r) => (
            <Table.Tr key={r.evaluacionId}>
              <Table.Td>{r.evaluacionId}</Table.Td>
              <Table.Td>Activo {r.activoId}</Table.Td>
              <Table.Td>{r.nivelDano}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

function Hitos({ p }: { p: Proyecto }) {
  const { usuario, tieneRol } = useSesion();
  const esResponsable = tieneRol('RESPONSABLE') && usuario?.id === p.responsableId;
  const editable = esResponsable && (p.estado === 'Formulado' || p.estado === 'Aprobado');
  const agregar = useAccion(
    (v: CrearHitoEntrada) => api.post(`/proyectos/${p.id}/hitos`, v),
    'Hito agregado',
  );
  const eliminar = useAccion(
    (hitoId: string) => api.delete(`/proyectos/${p.id}/hitos/${hitoId}`),
    'Hito eliminado',
  );
  const real = useAccion(
    ({ hitoId, fechaReal }: { hitoId: string; fechaReal: string }) =>
      api.patch(`/proyectos/${p.id}/hitos/${hitoId}`, { fechaReal }),
    'Fecha real registrada',
  );
  const { register, handleSubmit, reset, formState } = useForm<CrearHitoEntrada>({
    resolver: zodResolver(CrearHitoEntrada),
  });
  const [fechas, setFechas] = useState<Record<string, string>>({});
  return (
    <Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Hito</Table.Th>
            <Table.Th>Planificada</Table.Th>
            <Table.Th>Real</Table.Th>
            <Table.Th>Desviación (días)</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {p.hitos.map((h) => (
            <Table.Tr key={h.id}>
              <Table.Td>{h.nombre}</Table.Td>
              <Table.Td>{h.fechaPlanificada}</Table.Td>
              <Table.Td>{h.fechaReal ?? '—'}</Table.Td>
              <Table.Td>{h.desviacion ?? '—'}</Table.Td>
              <Table.Td>
                {editable && (
                  <Button size="xs" color="red" variant="subtle" onClick={() => eliminar.mutate(h.id)}>
                    Eliminar
                  </Button>
                )}
                {esResponsable && p.estado === 'EnEjecucion' && !h.fechaReal && (
                  <Group gap="xs">
                    <TextInput
                      size="xs"
                      type="date"
                      value={fechas[h.id] ?? ''}
                      onChange={(e) => setFechas({ ...fechas, [h.id]: e.currentTarget.value })}
                    />
                    <Button
                      size="xs"
                      disabled={!fechas[h.id]}
                      onClick={() => real.mutate({ hitoId: h.id, fechaReal: fechas[h.id] ?? '' })}
                    >
                      Registrar fecha real
                    </Button>
                  </Group>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {editable && (
        <form onSubmit={handleSubmit((v) => agregar.mutate(v, { onSuccess: () => reset() }))}>
          <Group align="flex-end">
            <TextInput
              label="Nombre del hito"
              {...register('nombre')}
              error={formState.errors.nombre?.message}
            />
            <TextInput
              label="Fecha planificada"
              type="date"
              {...register('fechaPlanificada')}
              error={formState.errors.fechaPlanificada?.message}
            />
            <Button type="submit" loading={agregar.isPending}>
              Agregar hito
            </Button>
          </Group>
        </form>
      )}
    </Stack>
  );
}

function Avances({ p }: { p: Proyecto }) {
  const { usuario, tieneRol } = useSesion();
  const puede = tieneRol('RESPONSABLE') && usuario?.id === p.responsableId && p.estado === 'EnEjecucion';
  const [valor, setValor] = useState<number | string>('');
  const registrar = useAccion(
    (porcentaje: number) => api.post(`/proyectos/${p.id}/avances`, { porcentaje }),
    'Avance registrado',
  );
  return (
    <Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Avance físico</Table.Th>
            <Table.Th>Usuario</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {p.avances.map((a, i) => (
            <Table.Tr key={i}>
              <Table.Td>{fechaHora(a.fechaHora)}</Table.Td>
              <Table.Td>{a.porcentaje} %</Table.Td>
              <Table.Td>{a.usuarioId}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {puede && (
        <Group align="flex-end">
          <NumberInput
            label="Nuevo avance (%)"
            min={0}
            max={100}
            decimalScale={2}
            value={valor}
            onChange={setValor}
          />
          <Button
            disabled={valor === ''}
            loading={registrar.isPending}
            onClick={() => registrar.mutate(Number(valor), { onSuccess: () => setValor('') })}
          >
            Registrar avance
          </Button>
        </Group>
      )}
    </Stack>
  );
}

function Costos({ p }: { p: Proyecto }) {
  const { usuario, tieneRol } = useSesion();
  const puede = tieneRol('RESPONSABLE') && usuario?.id === p.responsableId && p.estado === 'EnEjecucion';
  const registrar = useAccion(
    (v: RegistrarCostoEntrada) => api.post(`/proyectos/${p.id}/costos`, v),
    'Costo registrado',
  );
  const { register, handleSubmit, reset, formState } = useForm<RegistrarCostoEntrada>({
    resolver: zodResolver(RegistrarCostoEntrada),
  });
  return (
    <Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Concepto</Table.Th>
            <Table.Th>Valor</Table.Th>
            <Table.Th>Usuario</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {p.costos.map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td>{fechaHora(c.fechaHora)}</Table.Td>
              <Table.Td>{c.concepto}</Table.Td>
              <Table.Td>{pesos(c.valor)}</Table.Td>
              <Table.Td>{c.usuarioId}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {puede && (
        <form onSubmit={handleSubmit((v) => registrar.mutate(v, { onSuccess: () => reset() }))}>
          <Group align="flex-end">
            <TextInput
              label="Concepto"
              {...register('concepto')}
              error={formState.errors.concepto?.message}
            />
            <TextInput
              label="Valor (pesos)"
              placeholder="1500000.00"
              {...register('valor')}
              error={formState.errors.valor?.message}
            />
            <Button type="submit" loading={registrar.isPending}>
              Registrar costo
            </Button>
          </Group>
        </form>
      )}
    </Stack>
  );
}

function Presupuesto({ p }: { p: Proyecto }) {
  const { usuario, tieneRol } = useSesion();
  const esResponsable = tieneRol('RESPONSABLE') && usuario?.id === p.responsableId;
  const puedeSolicitar = esResponsable && !['Suspendido', ...FINALES].includes(p.estado);
  const solicitar = useAccion(
    (v: SolicitarCambioPresupuestoEntrada) => api.post(`/proyectos/${p.id}/cambios-presupuesto`, v),
    'Cambio solicitado',
  );
  const resolver = useAccion(
    ({
      cambioId,
      decision,
      motivo,
    }: {
      cambioId: string;
      decision: 'APROBAR' | 'RECHAZAR';
      motivo?: string;
    }) => api.post(`/proyectos/${p.id}/cambios-presupuesto/${cambioId}/resolucion`, { decision, motivo }),
    'Cambio resuelto',
  );
  const { register, handleSubmit, reset, formState } = useForm<SolicitarCambioPresupuestoEntrada>({
    resolver: zodResolver(SolicitarCambioPresupuestoEntrada),
  });
  return (
    <Stack>
      <Text>
        Presupuesto vigente: <b>{pesos(p.presupuesto.valorVigente)}</b>
      </Text>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Anterior</Table.Th>
            <Table.Th>Nuevo</Table.Th>
            <Table.Th>Motivo</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Solicitó</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {p.cambiosPresupuesto.map((c) => (
            <Table.Tr key={c.id}>
              <Table.Td>{fechaHora(c.solicitadoEn)}</Table.Td>
              <Table.Td>{pesos(c.valorAnterior)}</Table.Td>
              <Table.Td>{pesos(c.valorNuevo)}</Table.Td>
              <Table.Td>{c.motivo}</Table.Td>
              <Table.Td>
                <Badge>{c.estado}</Badge>
              </Table.Td>
              <Table.Td>{c.solicitanteId}</Table.Td>
              <Table.Td>
                {tieneRol('APROBADOR') && c.estado === 'Pendiente' && c.solicitanteId !== usuario?.id && (
                  <Group gap="xs">
                    <Button
                      size="xs"
                      onClick={() => resolver.mutate({ cambioId: c.id, decision: 'APROBAR' })}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="outline"
                      onClick={() =>
                        resolver.mutate({
                          cambioId: c.id,
                          decision: 'RECHAZAR',
                          motivo: 'Rechazado por el aprobador',
                        })
                      }
                    >
                      Rechazar
                    </Button>
                  </Group>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {puedeSolicitar && (
        <form onSubmit={handleSubmit((v) => solicitar.mutate(v, { onSuccess: () => reset() }))}>
          <Group align="flex-end">
            <TextInput
              label="Nuevo presupuesto (pesos)"
              {...register('valorNuevo')}
              error={formState.errors.valorNuevo?.message}
            />
            <TextInput label="Motivo" {...register('motivo')} error={formState.errors.motivo?.message} />
            <Button type="submit" loading={solicitar.isPending}>
              Solicitar cambio
            </Button>
          </Group>
        </form>
      )}
    </Stack>
  );
}

function Evidencias({ p }: { p: Proyecto }) {
  const { usuario, tieneRol } = useSesion();
  const puede = tieneRol('RESPONSABLE') && usuario?.id === p.responsableId && p.estado === 'EnEjecucion';
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState<string | null>('AVANCE');
  const subir = useAccion(() => {
    const f = new FormData();
    f.append('tipo', tipo ?? '');
    if (archivo) f.append('archivo', archivo);
    return api.post(`/proyectos/${p.id}/evidencias`, f);
  }, 'Evidencia adjuntada');
  return (
    <Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Archivo</Table.Th>
            <Table.Th>Autor</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {p.evidencias.map((e) => (
            <Table.Tr key={e.id}>
              <Table.Td>{fechaHora(e.fechaHora)}</Table.Td>
              <Table.Td>{e.tipo}</Table.Td>
              <Table.Td>{e.nombreArchivo}</Table.Td>
              <Table.Td>{e.autorId}</Table.Td>
              <Table.Td>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() =>
                    api
                      .descargar(`/proyectos/${p.id}/evidencias/${e.id}/archivo`, e.nombreArchivo)
                      .catch(mostrarError)
                  }
                >
                  Descargar
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {puede && (
        <Group align="flex-end">
          <Select
            label="Tipo"
            data={TipoEvidencia.options}
            value={tipo}
            onChange={setTipo}
            allowDeselect={false}
          />
          <FileInput
            label="Archivo (PDF, JPG o PNG, máx. 10 MB)"
            accept="application/pdf,image/jpeg,image/png"
            value={archivo}
            onChange={setArchivo}
          />
          <Button
            disabled={!archivo}
            loading={subir.isPending}
            onClick={() => subir.mutate(undefined, { onSuccess: () => setArchivo(null) })}
          >
            Adjuntar
          </Button>
        </Group>
      )}
    </Stack>
  );
}

function Historial({ p }: { p: Proyecto }) {
  return (
    <Card withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Fecha</Table.Th>
            <Table.Th>De</Table.Th>
            <Table.Th>A</Table.Th>
            <Table.Th>Motivo</Table.Th>
            <Table.Th>Usuario</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {p.historialEstados.map((h, i) => (
            <Table.Tr key={i}>
              <Table.Td>{fechaHora(h.fechaHora)}</Table.Td>
              <Table.Td>{h.anterior ?? '—'}</Table.Td>
              <Table.Td>{h.nuevo}</Table.Td>
              <Table.Td>{h.motivo}</Table.Td>
              <Table.Td>{h.usuarioId}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
