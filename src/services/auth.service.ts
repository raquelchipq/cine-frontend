import { Rol, RolAsignado } from '@/types/auth';
import { http } from '@/lib/http';

/**
 * Llamadas al recurso de seguridad.
 *
 * `listarRoles` usa GET /auth/roles (ADMIN o GERENTE) y `asignarRol` usa
 * POST /auth/rol-usuario, que es exclusivo del ADMIN: el gerente no puede
 * mover roles, por eso esa pantalla no se le ofrece.
 *
 * El rol asignado se refleja recien cuando la persona vuelve a iniciar
 * sesion, porque viene en el token: el backend lo aclara en su documentacion.
 */
export const authService = {
  async listarRoles(): Promise<Rol[]> {
    const { data } = await http.get<{
      status: string;
      message?: string;
      data: Rol[];
    }>('/auth/roles');

    return data.data;
  },

  async asignarRol(idPersona: number, idRol: number): Promise<RolAsignado> {
    const { data } = await http.post<{
      status: string;
      message?: string;
      data: RolAsignado;
    }>('/auth/rol-usuario', { idPersona, idRol });

    return data.data;
  },
};
