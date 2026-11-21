import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { AuthContext, UserModel } from '@/auth/context/auth-context';
import { http } from '@/lib/http';
import { decodificarJwt } from '@/lib/jwt';
import { borrarToken, guardarToken, leerToken } from '@/lib/token';

/**
 * Sesion real contra el backend.
 *
 * login llama a POST /auth/login, guarda el token bajo `cine_token` y devuelve
 * la sesion para que el formulario elija el destino. lib/http.ts lee ese mismo
 * token y lo adjunta como Bearer en cada peticion: eso es lo que abre los
 * endpoints protegidos, como POST /peliculas (ADMIN o GERENTE).
 *
 * La firma del token no se valida aqui; la valida el backend y contesta 401 si
 * ya vencio.
 */

/** Arma el usuario de la sesion a partir del payload del token. */
function sesionDesdeToken(token: string): UserModel {
  const payload = decodificarJwt(token);

  return {
    id: payload.id,
    usuario: payload.usuario ?? 'Usuario',
    roles: payload.roles ?? [],
  };
}

export function CineAuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserModel | undefined>(undefined);

  // La sesion se restaura al recargar la pagina
  useEffect(() => {
    const token = leerToken();
    if (token) {
      setUser(sesionDesdeToken(token));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (usuario: string, contrasena: string) => {
    const { data } = await http.post<{
      status: string;
      message: string;
      data: { token: string };
    }>('/auth/login', { usuario, contrasena });

    const token = data?.data?.token;
    if (!token) {
      throw new Error('El servidor no devolvio un token.');
    }

    guardarToken(token);
    const sesion = sesionDesdeToken(token);
    setUser(sesion);
    return sesion;
  }, []);

  const logout = useCallback(() => {
    borrarToken();
    setUser(undefined);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        isAuthenticated: user !== undefined,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
