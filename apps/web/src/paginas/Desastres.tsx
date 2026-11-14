import { Badge, Button, Group, Loader, Stack, Table, Title } from '@mantine/core';
import { api } from '../api/cliente';
import { useAccion, useDesastres } from '../api/hooks';

export function Desastres() {
  const { data, isLoading } = useDesastres();
  const pasar = useAccion(
    (id: string) => api.post(`/desastres/${id}/pasar-a-reconstruccion`),
    'El desastre pasó a Reconstrucción',
  );
  const cerrar = useAccion((id: string) => api.post(`/desastres/${id}/cerrar`), 'Desastre cerrado');
  if (isLoading) return <Loader />;
  return (
    <Stack>
      <Title order={2}>Desastres</Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Id</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Municipio</Table.Th>
            <Table.Th>Ocurrió</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data?.map((d) => (
            <Table.Tr key={d.id}>
              <Table.Td>{d.id}</Table.Td>
              <Table.Td>{d.nombre}</Table.Td>
              <Table.Td>{d.municipio}</Table.Td>
              <Table.Td>{d.fechaOcurrencia}</Table.Td>
              <Table.Td>
                <Badge>{d.estado}</Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {d.estado === 'CARACTERIZACION' && (
                    <Button size="xs" onClick={() => pasar.mutate(d.id)}>
                      Pasar a Reconstrucción
                    </Button>
                  )}
                  {d.estado === 'RECONSTRUCCION' && (
                    <Button size="xs" color="gray" onClick={() => cerrar.mutate(d.id)}>
                      Cerrar
                    </Button>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
