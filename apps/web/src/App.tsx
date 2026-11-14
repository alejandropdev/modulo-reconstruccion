import type { Rol } from '@reconstruccion/contratos';
import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSesion } from './auth/Sesion';
import { Layout } from './componentes/Layout';
import { BandejaAprobador } from './paginas/BandejaAprobador';
import { CargaMasiva } from './paginas/CargaMasiva';
import { Desastres } from './paginas/Desastres';
import { DetalleProyecto } from './paginas/DetalleProyecto';
import { Login } from './paginas/Login';
import { NuevoProyecto } from './paginas/NuevoProyecto';
import { Proyectos } from './paginas/Proyectos';

function Protegida({ rol, children }: { rol?: Rol; children: ReactElement }) {
  const { usuario, tieneRol } = useSesion();
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && !tieneRol(rol)) return <Navigate to="/proyectos" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protegida>
            <Layout />
          </Protegida>
        }
      >
        <Route path="/proyectos" element={<Proyectos />} />
        <Route
          path="/proyectos/nuevo"
          element={
            <Protegida rol="AUTORIDAD">
              <NuevoProyecto />
            </Protegida>
          }
        />
        <Route
          path="/proyectos/masivo"
          element={
            <Protegida rol="AUTORIDAD">
              <CargaMasiva />
            </Protegida>
          }
        />
        <Route path="/proyectos/:id" element={<DetalleProyecto />} />
        <Route
          path="/bandeja"
          element={
            <Protegida rol="APROBADOR">
              <BandejaAprobador />
            </Protegida>
          }
        />
        <Route
          path="/desastres"
          element={
            <Protegida rol="AUTORIDAD">
              <Desastres />
            </Protegida>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/proyectos" replace />} />
    </Routes>
  );
}
