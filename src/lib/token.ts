import { getData, setData } from '@/lib/storage';

/**
 * Guarda y lee el token de la sesion.
 *
 * Existe para que la clave `cine_token` este en un solo lugar: el login la
 * escribe, el interceptor de lib/http.ts la lee y el 401 la borra.
 */
const CLAVE = 'cine_token';

export function leerToken(): string | undefined {
  const token = getData(CLAVE);
  return typeof token === 'string' ? token : undefined;
}

export function guardarToken(token: string): void {
  setData(CLAVE, token);
}

export function borrarToken(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Si el navegador bloquea el almacenamiento no hay nada que borrar
  }
}
