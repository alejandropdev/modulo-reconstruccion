import {
  Badge,
  Checkbox,
  Group,
  Loader,
  Pagination,
  Progress,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { EstadoProyecto } from '@reconstruccion/contratos';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesastres, useProyectos } from '../api/hooks';
import { pesos } from '../componentes/Dinero';

export function Proyectos() {
  const navegar = useNavigate();
  const [desastreId, setDesastreId] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [responsableId, setResponsableId] = useState('');
  const [atrasado, setAtrasado] = useState(false);
  const [pagina, setPagina] = useState(1);
  const desastres = useDesastres();
  const { data, isLoading } = useProyectos({
    desastreId: desastreId ?? undefined,
    estado: estado ?? undefined,
    responsableId,
    atrasado: atrasado || undefined,
    pagina,
    tamano: 15,
  });

  return (
    <Stack>
      <Title order={2}>Proyectos</Title>
      <Group align="flex-end">
        <Select
          label="Desastre"
          clearable
          data={(desastres.data ?? []).map((d) => ({ value: d.id, label: `${d.id} — ${d.nombre}` }))}
          value={desastreId}
          onChange={(v) => {
            setDesastreId(v);
            setPagina(1);
          }}
        />
        <Select
          label="Estado"
          clearable
          data={EstadoProyecto.options}
          value={estado}
          onChange={(v) => {
            setEstado(v);
            setPagina(1);
          }}
        />
        <TextInput
          label="Responsable (id)"
          placeholder="u-responsable1"
          value={responsableId}
          onChange={(e) => {
            setResponsableId(e.currentTarget.value);
            setPagina(1);
          }}
        />
        <Checkbox
          label="Solo atrasados"
          checked={atrasado}
          onChange={(e) => {
            setAtrasado(e.currentTarget.checked);
            setPagina(1);
          }}
        />
      </Group>
      {isLoading ? (
        <Loader />
      ) : (
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Proyecto</Table.Th>
              <Table.Th>Desastre</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Intervención</Table.Th>
              <Table.Th>Responsable</Table.Th>
              <Table.Th>Presupuesto</Table.Th>
              <Table.Th w={160}>Avance físico</Table.Th>
              <Table.Th w={160}>Avance financiero</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.items.map((p) => (
              <Table.Tr
                key={p.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navegar(`/proyectos/${p.id}`)}
              >
                <Table.Td>{p.id.slice(0, 8)}</Table.Td>
                <Table.Td>{p.desastreId}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Badge>{p.estado}</Badge>
                    {p.estaAtrasado && <Badge color="red">Atrasado</Badge>}
                  </Group>
                </Table.Td>
                <Table.Td>{p.tipoIntervencion}</Table.Td>
                <Table.Td>{p.responsableId}</Table.Td>
                <Table.Td>{pesos(p.valorVigente)}</Table.Td>
                <Table.Td>
                  <Progress value={p.avanceFisico} />
                  <Text size="xs">{p.avanceFisico} %</Text>
                </Table.Td>
                <Table.Td>
                  <Progress value={p.avanceFinanciero} color="teal" />
                  <Text size="xs">{p.avanceFinanciero} %</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
      {data && data.items.length === 0 && <Text c="dimmed">No hay proyectos con esos filtros.</Text>}
      {data && (
        <Pagination
          total={Math.max(1, Math.ceil(data.total / data.tamano))}
          value={pagina}
          onChange={setPagina}
        />
      )}
    </Stack>
  );
}
