import { Button, Card, Center, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginEntrada } from '@reconstruccion/contratos';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { mostrarError } from '../api/hooks';
import { useSesion } from '../auth/Sesion';

export function Login() {
  const { usuario, login } = useSesion();
  const navegar = useNavigate();
  const { register, handleSubmit, formState } = useForm<LoginEntrada>({
    resolver: zodResolver(LoginEntrada),
  });
  if (usuario) return <Navigate to="/proyectos" replace />;
  return (
    <Center h="100vh">
      <Card withBorder w={360} p="lg">
        <form
          onSubmit={handleSubmit(async (v) => {
            try {
              await login(v.correo, v.contrasena);
              navegar('/proyectos');
            } catch (e) {
              mostrarError(e);
            }
          })}
        >
          <Stack>
            <Title order={3}>Iniciar sesión</Title>
            <TextInput label="Correo" {...register('correo')} error={formState.errors.correo?.message} />
            <PasswordInput
              label="Contraseña"
              {...register('contrasena')}
              error={formState.errors.contrasena?.message}
            />
            <Button type="submit" loading={formState.isSubmitting}>
              Entrar
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
