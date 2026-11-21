/**
 * Decodifica el JWT de la sesion.
 *
 * No valida la firma: eso lo hace el backend, que responde 401 si el token
 * vencio o fue alterado. Aqui solo se lee el payload para saber quien entro y
 * con que roles, sin tener que preguntarselo a la API.
 */

export interface PayloadJwt {
  id?: number;
  usuario?: string;
  roles?: string[];
}

export function decodificarJwt(token: string): PayloadJwt {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};

    // El base64url del JWT no es el de atob: primero se cambian los simbolos
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as PayloadJwt;
  } catch {
    // Token mal formado: se trata como si no trajera datos
    return {};
  }
}
