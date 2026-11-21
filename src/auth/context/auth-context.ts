import { createContext, useContext } from 'react';

/** Usuario de la sesion, tal como viene dentro del token. */
export interface UserModel {
  id?: number;
  usuario: string;
  roles: string[];
}

interface AuthContextValue {
  /** true mientras se restaura la sesion guardada. */
  loading: boolean;
  isAuthenticated: boolean;
  user?: UserModel;
  /**
   * Inicia sesion y devuelve la sesion, para que el formulario decida a donde
   * mandar al usuario segun sus roles.
   */
  login: (usuario: string, contrasena: string) => Promise<UserModel>;
  logout: () => void;
}

/**
 * Contrato de la sesion.
 *
 * Esta es la pieza que el resto de la aplicacion consume: la cabecera para
 * mostrar el nombre, RequireAuth y RequireRole para bloquear rutas, el
 * formulario para entrar. Ninguno de ellos sabe de donde salen los datos, y esa
 * es la idea: el dia que cambie la forma de entrar, solo cambia el proveedor.
 */
export const AuthContext = createContext<AuthContextValue>({
  loading: false,
  isAuthenticated: false,
  login: async () => ({ usuario: '', roles: [] }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
