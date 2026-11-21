/**
 * Datos de los roles.
 *
 * `Rol` es lo que devuelve GET /auth/roles (ADMIN o GERENTE) y `RolAsignado`
 * la respuesta de POST /auth/rol-usuario, que pide ADMIN.
 *
 * Ojo: en la entidad el rol se llama `id`, aunque en la base la columna sea
 * id_rol. Ese id es el que se manda al asignar.
 */
export interface Rol {
  id: number;
  rol: string;
}

export interface RolAsignado {
  idRolUsuario: number;
  /** Aqui la base si usa id_usuario y enlaza con la persona */
  idUsuario: number;
  idRol: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: boolean;
}
