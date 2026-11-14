import { Badge, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { type DetalleProyectoSalida } from '@reconstruccion/contratos';
import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente';
import { useAccion, useProyectos } from '../api/hooks';
import { useSesion } from '../auth/Sesion';
import { pesos } from '../componentes/Dinero';

/** Proyectos Formulados por aprobar y cambios de presupuesto pendientes. */
export function BandejaAprobador() {
  const { usuario } = useSesion();
  const formulados = useProyectos({ estado: 'Formulado', tamano: 100 });
  const ejecucion = useProyectos({ estado: 'EnEjecucion', tamano: 100 });
  const aprobados = useProyectos({ estado: 'Aprobado', tamano: 100 });
  const conPendientes = [
    ...(ejecucion.data?.items ?? []),
    ...(aprobados.data?.items ?? []),
    ...(formulados.data?.items ?? []),
  ].filter((p) => p.cambiosPendientes > 0);
  const detalles = useQueries({
    queries: conPendientes.map((p) => ({
      queryKey: ['proyecto', p.id],
      queryFn: () => api.get<DetalleProyectoSalida>(`/proyectos/${p.id}`),
    })),
  });

  const aprobar = useAccion((id: string) => api.post(`/proyectos/${id}/aprobar`), 'Proyecto aprobado');
  const resolver = useAccion(
    ({ id, cambioId, decision }: { id: string; cambioId: string; decision: 'APROBAR' | 'RECHAZAR' }) =>
      api.post(`/proyectos/${id}/cambios-presupuesto/${cambioId}/resolucion`, {
        decision,
        ...(decision === 'RECHAZAR' ? { motivo: 'Rechazado por el aprobador' } : {}),
      }),
    'Cambio resuelto',
  );

  if (formulados.isLoading) return <Loader />;
  return (
    <Stack>
      <Title order={2}>Bandeja del aprobador</Title>
      <Title order={4}>Proyectos por aprobar</Title>
      <Table>
        <Table.Tbody>
          {formulados.data?.items.map((p) => (
            <Table.Tr key={p.id}>
              <Table.Td>
                <Link to={`/proyectos/${p.id}`}>{p.id.slice(0, 8)}</Link>
              </Table.Td>
              <Table.Td>{p.desastreId}</Table.Td>
              <Table.Td>{pesos(p.valorVigente)}</Table.Td>
              <Table.Td>{p.tipoIntervencion}</Table.Td>
              <Table.Td>
                <Button size="xs" loading={aprobar.isPending} onClick={() => aprobar.mutate(p.id)}>
                  Aprobar
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {formulados.data?.items.length === 0 && <Text c="dimmed">No hay proyectos por aprobar.</Text>}
      <Title order={4}>Cambios de presupuesto pendientes</Title>
      <Table>
        <Table.Tbody>
          {detalles.flatMap(
            (d) =>
              d.data?.cambiosPresupuesto
                .filter((c) => c.estado === 'Pendiente')
                .map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Link to={`/proyectos/${d.data?.id}`}>{d.data?.id.slice(0, 8)}</Link>
                    </Table.Td>
                    <Table.Td>
                      {pesos(c.valorAnterior)} → {pesos(c.valorNuevo)}
                    </Table.Td>
                    <Table.Td>{c.motivo}</Table.Td>
                    <Table.Td>
                      <Badge>{c.solicitanteId}</Badge>
                    </Table.Td>
                    <Table.Td>
                      {c.solicitanteId !== usuario?.id && d.data && (
                        <Group gap="xs">
                          <Button
                            size="xs"
                            onClick={() =>
                              resolver.mutate({ id: d.data.id, cambioId: c.id, decision: 'APROBAR' })
                            }
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            variant="outline"
                            onClick={() =>
                              resolver.mutate({ id: d.data.id, cambioId: c.id, decision: 'RECHAZAR' })
                            }
                          >
                            Rechazar
                          </Button>
                        </Group>
                      )}
                    </Table.Td>
                  </Table.Tr>
                )) ?? [],
          )}
        </Table.Tbody>
      </Table>
      {conPendientes.length === 0 && <Text c="dimmed">No hay cambios pendientes.</Text>}
    </Stack>
  );
}
