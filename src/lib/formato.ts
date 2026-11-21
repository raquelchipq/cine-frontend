/**
 * Formato de datos para mostrar.
 *
 * El backend manda las fechas en ISO completo (2024-03-01T04:00:00.000Z) y las
 * horas con segundos (19:00:00); las pantallas solo quieren la parte util. Los
 * precios pueden llegar como texto porque la columna es numeric.
 */

/** '2024-03-01T04:00:00.000Z' -> '2024-03-01' */
export function fechaCorta(fecha: string): string {
  return fecha.slice(0, 10);
}

/** '19:00:00' -> '19:00' */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

/** 35 -> '35.00 Bs'; el backend puede mandar el precio como texto */
export function moneda(valor: number | string): string {
  return `${Number(valor).toFixed(2)} Bs`;
}

/**
 * Fecha de hoy en AAAA-MM-DD, para precargar los inputs date.
 *
 * Se arma con los getters locales a proposito: toISOString() devuelve UTC y en
 * Bolivia, de noche, adelantaria un dia.
 */
export function hoy(): string {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
