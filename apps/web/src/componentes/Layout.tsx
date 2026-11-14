import { AppShell, Button, Group, Text, Title } from '@mantine/core';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useSesion } from '../auth/Sesion';

export function Layout() {
  const { usuario, logout, tieneRol } = useSesion();
  const navegar = useNavigate();
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Title order={4}>Reconstrucción</Title>
            <Button component={Link} to="/proyectos" variant="subtle">
              Proyectos
            </Button>
            {tieneRol('AUTORIDAD') && (
              <Button component={Link} to="/proyectos/nuevo" variant="subtle">
                Nuevo proyecto
              </Button>
            )}
            {tieneRol('AUTORIDAD') && (
              <Button component={Link} to="/proyectos/masivo" variant="subtle">
                Carga masiva
              </Button>
            )}
            {tieneRol('APROBADOR') && (
              <Button component={Link} to="/bandeja" variant="subtle">
                Bandeja del aprobador
              </Button>
            )}
            {tieneRol('AUTORIDAD') && (
              <Button component={Link} to="/desastres" variant="subtle">
                Desastres
              </Button>
            )}
          </Group>
          <Group>
            <Text size="sm">
              {usuario?.nombre} ({usuario?.roles.join(', ')})
            </Text>
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                logout();
                navegar('/login');
              }}
            >
              Salir
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
