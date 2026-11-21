/**
 * Datos del registro de una persona.
 *
 * `RegistrarPersona` es lo que manda POST /persona: ese endpoint es publico y
 * crea de una sola vez la persona, su usuario y su cliente (rol CLIENTE).
 */
export interface RegistrarPersona {
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  /** Fecha ISO, por ejemplo 1995-05-20 */
  fechaNacimiento: string;
  usuario: string;
  // OJO: el campo se llama asi en el backend, con la errata incluida
  constrasena: string;
}

export interface PersonaRegistrada {
  nombres: string;
  apellidos: string;
  telefono: string;
}

/**
 * Fila del listado GET /persona (paginado, solo ADMIN o GERENTE).
 *
 * En la base el id se llama id_persona, pero la entidad lo expone como `id`.
 */
export interface PersonaListada {
  id: number;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  /** ISO completo */
  fechaNacimiento: string;
}
