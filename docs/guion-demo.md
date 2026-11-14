# Guion de demostración

Usuarios: ver README (contraseña `Clave123*`). Web en <http://localhost:8080>.

1. **R01 / R02 — ciclo del desastre.** Ingrese como `autoridad`. En *Desastres* intente pasar D-003 (Registro) a Reconstrucción por la API (`POST /desastres/D-003/pasar-a-reconstruccion`): R01. D-004 no tiene evaluaciones validadas con intervención: R02. D-001 (Caracterización) sí pasa.
2. **Crear proyecto.** Como `autoridad.aprobadora`: *Nuevo proyecto* → D-002 → evaluación E-21 (SEVERO) → tipo RECONSTRUCCION → presupuesto `2500000000`, fuente SGR, responsable `u-responsable1`, contratista opcional.
3. **R05.** Repita la creación con E-21: error 409 `R05` (la evaluación ya está en un proyecto activo).
4. **R07.** Con el mismo usuario `autoridad.aprobadora`, abra el proyecto y verifique que no aparece *Aprobar*; por API devuelve 422 `R07`. Ingrese como `aprobador1` y apruebe.
5. **R08.** Como `responsable1`, intente *Iniciar ejecución* sin hito: `R08`. Agregue un hito en la pestaña *Hitos* y vuelva a iniciar.
6. **R14.** Registre avance 50 % y luego 40 %: `R14` (no puede bajar).
7. **R13.** Registre un costo mayor al presupuesto: `R13`. Registre uno válido y observe el avance financiero.
8. **R15.** Suspenda el proyecto con motivo; intente registrar avance o costo: `R15`. Reanude.
9. **R12.** Solicite cambio de presupuesto a `2600000000` (variación 100 millones > umbral de 50 millones): queda *Pendiente*. Ingrese como `aprobador1` (*Bandeja del aprobador*) y apruébelo; el presupuesto vigente cambia. Un cambio menor (p. ej. +10 millones) se aplica de inmediato.
10. **R09.** Intente *Finalizar* con avance menor a 100 %: `R09`. Registre 100 % e intente de nuevo sin evidencia: `R09`. Adjunte una evidencia tipo ENTREGA (PDF) y finalice.
11. **Cierre.** Como `autoridad`, cierre el desastre D-002 (R03 si quedan proyectos sin finalizar o cancelar).
12. **Carga masiva (C07).** *Carga masiva* con un CSV de varias filas, una de ellas repitiendo evaluación: se crean las válidas y el reporte muestra el error por fila.
