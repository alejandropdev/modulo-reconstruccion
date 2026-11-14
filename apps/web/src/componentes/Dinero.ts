const formato = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 2,
});

/** Muestra un monto en pesos (el valor llega como texto "123.45"). */
export const pesos = (valor: string): string => formato.format(Number(valor));
export const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
