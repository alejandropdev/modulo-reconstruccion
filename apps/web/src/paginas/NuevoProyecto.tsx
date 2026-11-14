import { Button, Fieldset, Group, MultiSelect, Select, Stack, TextInput, Title } from '@mantine/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { CrearProyectoEntrada, type NivelDano, type TipoIntervencion } from '@reconstruccion/contratos';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/cliente';
import { useAccion, useDesastres, useEvaluacionesElegibles } from '../api/hooks';

// C05: tipos permitidos según el mayor nivel de daño (misma tabla que la política del dominio).
const ORDEN: NivelDano[] = ['LEVE', 'MODERADO', 'SEVERO', 'TOTAL'];
const PERMITIDOS: Record<NivelDano, TipoIntervencion[]> = {
  LEVE: ['REPARACION'],
  MODERADO: ['REHABILITACION', 'REFORZAMIENTO'],
  SEVERO: ['RECONSTRUCCION'],
  TOTAL: ['RECONSTRUCCION', 'REUBICACION'],
};

export function NuevoProyecto() {
  const navegar = useNavigate();
  const desastres = useDesastres();
  const [contratista, setContratista] = useState({ nit: '', nombre: '' });
  const { control, register, handleSubmit, watch, formState } = useForm<CrearProyectoEntrada>({
    resolver: zodResolver(CrearProyectoEntrada),
    defaultValues: { evaluacionIds: [] },
  });
  const desastreId = watch('desastreId') ?? null;
  const seleccionadas = watch('evaluacionIds');
  const elegibles = useEvaluacionesElegibles(desastreId || null);
  const niveles = (elegibles.data ?? []).filter((e) => seleccionadas.includes(e.id)).map((e) => e.nivelDano);
  const mayor = niveles.reduce<NivelDano | null>(
    (m, n) => (m === null || ORDEN.indexOf(n) > ORDEN.indexOf(m) ? n : m),
    null,
  );
  const tipos = mayor ? PERMITIDOS[mayor] : [];
  const crear = useAccion(
    (v: CrearProyectoEntrada) => api.post<{ proyectoId: string }>('/proyectos', v),
    'Proyecto creado',
  );

  return (
    <form
      onSubmit={handleSubmit((v) =>
        crear.mutate(
          { ...v, ...(contratista.nit && contratista.nombre ? { contratista } : {}) },
          { onSuccess: (r) => navegar(`/proyectos/${r.proyectoId}`) },
        ),
      )}
    >
      <Stack maw={640}>
        <Title order={2}>Nuevo proyecto</Title>
        <Controller
          control={control}
          name="desastreId"
          render={({ field }) => (
            <Select
              label="Desastre (en Reconstrucción)"
              data={(desastres.data ?? [])
                .filter((d) => d.estado === 'RECONSTRUCCION')
                .map((d) => ({ value: d.id, label: `${d.id} — ${d.nombre}` }))}
              value={field.value ?? null}
              onChange={(v) => field.onChange(v ?? '')}
              error={formState.errors.desastreId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="evaluacionIds"
          render={({ field }) => (
            <MultiSelect
              label="Evaluaciones elegibles"
              data={(elegibles.data ?? []).map((e) => ({
                value: e.id,
                label: `${e.id} — activo ${e.activoId} (${e.nivelDano})`,
              }))}
              value={field.value}
              onChange={field.onChange}
              error={formState.errors.evaluacionIds?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="tipoIntervencion"
          render={({ field }) => (
            <Select
              label="Tipo de intervención"
              description={mayor ? `Mayor nivel de daño: ${mayor}` : 'Seleccione evaluaciones primero'}
              data={tipos}
              value={field.value ?? null}
              onChange={(v) => field.onChange(v ?? undefined)}
              error={formState.errors.tipoIntervencion?.message}
            />
          )}
        />
        <TextInput
          label="Presupuesto (pesos)"
          placeholder="2500000000.00"
          {...register('presupuesto')}
          error={formState.errors.presupuesto?.message}
        />
        <TextInput
          label="Fuente de financiación"
          {...register('fuenteFinanciacion')}
          error={formState.errors.fuenteFinanciacion?.message}
        />
        <TextInput
          label="Responsable (id de usuario)"
          placeholder="u-responsable1"
          {...register('responsableId')}
          error={formState.errors.responsableId?.message}
        />
        <Fieldset legend="Contratista (opcional)">
          <Group grow>
            <TextInput
              label="NIT"
              value={contratista.nit}
              onChange={(e) => setContratista({ ...contratista, nit: e.currentTarget.value })}
            />
            <TextInput
              label="Nombre"
              value={contratista.nombre}
              onChange={(e) => setContratista({ ...contratista, nombre: e.currentTarget.value })}
            />
          </Group>
        </Fieldset>
        <Button type="submit" loading={crear.isPending}>
          Crear proyecto
        </Button>
      </Stack>
    </form>
  );
}
