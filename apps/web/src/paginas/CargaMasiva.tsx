import { Alert, Badge, Button, FileInput, Stack, Table, Text, Title } from '@mantine/core';
import { CrearProyectoEntrada, type ReporteMasivoSalida } from '@reconstruccion/contratos';
import Papa from 'papaparse';
import { useState } from 'react';
import { api } from '../api/cliente';
import { useAccion } from '../api/hooks';

interface Fila {
  linea: number;
  datos?: CrearProyectoEntrada;
  error?: string;
}

/** Convierte una fila del CSV al JSON de la API. Columnas: desastreId,evaluaciones(;),tipoIntervencion,presupuesto,fuenteFinanciacion,responsableId,contratistaNit,contratistaNombre */
function aEntrada(f: Record<string, string>): unknown {
  return {
    desastreId: f['desastreId']?.trim(),
    evaluacionIds: (f['evaluaciones'] ?? '')
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean),
    tipoIntervencion: f['tipoIntervencion']?.trim(),
    presupuesto: f['presupuesto']?.trim(),
    fuenteFinanciacion: f['fuenteFinanciacion']?.trim() ?? '',
    responsableId: f['responsableId']?.trim() ?? '',
    ...(f['contratistaNit']?.trim() && f['contratistaNombre']?.trim()
      ? { contratista: { nit: f['contratistaNit'].trim(), nombre: f['contratistaNombre'].trim() } }
      : {}),
  };
}

export function CargaMasiva() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [reporte, setReporte] = useState<ReporteMasivoSalida | null>(null);
  const validas = filas.filter((f) => f.datos);
  const enviar = useAccion(
    () =>
      api
        .post<ReporteMasivoSalida>('/proyectos/masivo', { proyectos: validas.map((f) => f.datos) })
        .then(setReporte),
    'Carga procesada',
  );

  const leer = (archivo: File | null) => {
    setReporte(null);
    if (!archivo) return setFilas([]);
    Papa.parse<Record<string, string>>(archivo, {
      header: true,
      skipEmptyLines: true,
      complete: (r) =>
        setFilas(
          r.data.map((fila, i) => {
            const v = CrearProyectoEntrada.safeParse(aEntrada(fila));
            return v.success
              ? { linea: i + 2, datos: v.data }
              : {
                  linea: i + 2,
                  error: v.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
                };
          }),
        ),
    });
  };

  return (
    <Stack>
      <Title order={2}>Carga masiva de proyectos</Title>
      <Text size="sm" c="dimmed">
        CSV con columnas: desastreId, evaluaciones (separadas por ;), tipoIntervencion, presupuesto,
        fuenteFinanciacion, responsableId, contratistaNit, contratistaNombre. Máximo 100 filas.
      </Text>
      <FileInput label="Archivo CSV" accept=".csv,text/csv" onChange={leer} clearable />
      {filas.length > 0 && (
        <>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fila</Table.Th>
                <Table.Th>Desastre</Table.Th>
                <Table.Th>Evaluaciones</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Presupuesto</Table.Th>
                <Table.Th>Validación</Table.Th>
                <Table.Th>Resultado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filas.map((f) => {
                const idx = validas.indexOf(f);
                const r = reporte?.resultados.find((x) => x.indice === idx);
                return (
                  <Table.Tr key={f.linea}>
                    <Table.Td>{f.linea}</Table.Td>
                    <Table.Td>{f.datos?.desastreId}</Table.Td>
                    <Table.Td>{f.datos?.evaluacionIds.join(', ')}</Table.Td>
                    <Table.Td>{f.datos?.tipoIntervencion}</Table.Td>
                    <Table.Td>{f.datos?.presupuesto}</Table.Td>
                    <Table.Td>
                      {f.error ? (
                        <Text c="red" size="xs">
                          {f.error}
                        </Text>
                      ) : (
                        <Badge color="green">Válida</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {f.datos &&
                        r &&
                        (r.exito ? (
                          <Badge color="green">Creado {r.proyectoId?.slice(0, 8)}</Badge>
                        ) : (
                          <Text c="red" size="xs">
                            {r.errores?.map((e) => `${e.regla ?? e.codigo} — ${e.mensaje}`).join('; ')}
                          </Text>
                        ))}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
          {validas.length < filas.length && (
            <Alert color="yellow">Las filas con error de formato no se enviarán.</Alert>
          )}
          <Button
            disabled={validas.length === 0 || !!reporte}
            loading={enviar.isPending}
            onClick={() => enviar.mutate(undefined)}
          >
            Enviar {validas.length} proyectos
          </Button>
        </>
      )}
    </Stack>
  );
}
