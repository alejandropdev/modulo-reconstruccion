import { Button, Group, Modal, TextInput } from '@mantine/core';
import { Contratista } from '@reconstruccion/contratos';
import { useState } from 'react';

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  alConfirmar: (contratista: Contratista) => void;
  cargando?: boolean;
}

/** Diálogo para indicar el contratista al iniciar la ejecución (R08 lo exige cuando el proyecto no tiene uno). */
export function ModalContratista({ abierto, alCerrar, alConfirmar, cargando }: Props) {
  const [nit, setNit] = useState('');
  const [nombre, setNombre] = useState('');
  const [errores, setErrores] = useState<{ nit?: string; nombre?: string }>({});

  const confirmar = () => {
    const resultado = Contratista.safeParse({ nit: nit.trim(), nombre: nombre.trim() });
    if (!resultado.success) {
      setErrores({
        ...(!nit.trim() ? { nit: 'Indique el NIT del contratista' } : {}),
        ...(!nombre.trim() ? { nombre: 'Indique el nombre del contratista' } : {}),
      });
      return;
    }
    setErrores({});
    alConfirmar(resultado.data);
  };

  return (
    <Modal opened={abierto} onClose={alCerrar} title="Contratista del proyecto">
      <TextInput
        label="NIT"
        value={nit}
        onChange={(e) => setNit(e.currentTarget.value)}
        error={errores.nit}
        data-autofocus
      />
      <TextInput
        mt="sm"
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.currentTarget.value)}
        error={errores.nombre}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button loading={cargando ?? false} onClick={confirmar}>
          Iniciar ejecución
        </Button>
      </Group>
    </Modal>
  );
}
