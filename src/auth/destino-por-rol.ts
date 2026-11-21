/**
 * A donde entra cada rol despues de iniciar sesion.
 *
 * Vive aparte porque lo usan el ingreso y el registro. El panel esta en `/` en
 * este estado del proyecto: ADMIN y GERENTE entran ahi y el CLIENTE va directo
 * a la cartelera.
 */
export function destinoPorRol(roles: string[]): string {
  const administrativo = roles.some(
    (rol) => rol === 'ADMIN' || rol === 'GERENTE',
  );
  return administrativo ? '/' : '/peliculas';
}
