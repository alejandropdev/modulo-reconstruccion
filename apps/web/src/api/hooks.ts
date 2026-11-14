import type {
  DesastreSalida,
  DetalleProyectoSalida,
  EvaluacionSalida,
  ListaProyectosSalida,
} from '@reconstruccion/contratos';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ErrorDeApi } from './cliente';

export function mostrarError(e: unknown): void {
  notifications.show({
    color: 'red',
    title: 'No se pudo completar la acción',
    message: e instanceof ErrorDeApi ? e.texto : String(e),
  });
}

export const useDesastres = () =>
  useQuery({ queryKey: ['desastres'], queryFn: () => api.get<DesastreSalida[]>('/desastres') });

export const useEvaluacionesElegibles = (desastreId: string | null) =>
  useQuery({
    queryKey: ['elegibles', desastreId],
    queryFn: () => api.get<EvaluacionSalida[]>(`/desastres/${desastreId}/evaluaciones-elegibles`),
    enabled: !!desastreId,
  });

export const useProyecto = (id: string) =>
  useQuery({ queryKey: ['proyecto', id], queryFn: () => api.get<DetalleProyectoSalida>(`/proyectos/${id}`) });

export function useProyectos(filtros: Record<string, string | number | boolean | undefined>) {
  const q = new URLSearchParams(
    Object.entries(filtros)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );
  return useQuery({
    queryKey: ['proyectos', q.toString()],
    queryFn: () => api.get<ListaProyectosSalida>(`/proyectos?${q}`),
  });
}

/** Ejecuta una acción de la API, avisa el resultado y refresca los datos afectados. */
export function useAccion<T, R = unknown>(
  accion: (v: T) => Promise<R>,
  mensajeExito: string,
  invalidar: string[] = ['proyecto', 'proyectos', 'desastres', 'elegibles'],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accion,
    onSuccess: async () => {
      notifications.show({ color: 'green', message: mensajeExito });
      await Promise.all(invalidar.map((k) => qc.invalidateQueries({ queryKey: [k] })));
    },
    onError: mostrarError,
  });
}
