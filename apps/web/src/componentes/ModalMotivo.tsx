import { Button, Group, Modal, Textarea } from '@mantine/core';
import { useState } from 'react';

interface Props {
  titulo: string;
  abierto: boolean;
  alCerrar: () => void;
  alConfirmar: (motivo: string) => void;
  cargando?: boolean;
}

/** Diálogo para acciones que exigen motivo (suspender, reanudar, cancelar, rechazar). */
export function ModalMotivo({ titulo, abierto, alCerrar, alConfirmar, cargando }: Props) {
  const [motivo, setMotivo] = useState('');
  return (
    <Modal opened={abierto} onClose={alCerrar} title={titulo}>
      <Textarea
        label="Motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.currentTarget.value)}
        autosize
        minRows={3}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button
          loading={cargando ?? false}
          onClick={() => {
            alConfirmar(motivo);
            setMotivo('');
          }}
        >
          Confirmar
        </Button>
      </Group>
    </Modal>
  );
}
