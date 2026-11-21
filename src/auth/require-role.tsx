import { Navigate, Outlet } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from './context/auth-context';

/**
 * Bloquea las rutas que piden un rol.
 *
 * No es seguridad: el backend vuelve a comprobar el rol y responde 403. Sirve
 * para no ofrecer pantallas que de todas formas van a rechazar. Si el usuario
 * entro pero no tiene el rol, se lo manda a la cartelera.
 */
export const RequireRole = ({ roles }: { roles: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  const tieneRol = user?.roles.some((rol) => roles.includes(rol)) ?? false;

  if (!isAuthenticated || !tieneRol) {
    return <Navigate to="/peliculas" replace />;
  }

  return <Outlet />;
};
