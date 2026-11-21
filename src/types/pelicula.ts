/**
 * Forma de los datos del modulo de peliculas.
 *
 * `Pelicula` es lo que viene dentro de `RespuestaPaginada` en GET /peliculas.
 * `CrearPelicula` es lo que manda el formulario y `PeliculaCreada` lo que
 * devuelve POST /peliculas: el backend renombra los campos
 * (duracionMinutos -> duracion, fechaEstreno -> fecha) y no manda imagenes.
 */

export interface Pelicula {
  id: number;
  titulo: string;
  sinopsis: string;
  duracionMinutos: number;
  fechaEstreno: string;
  activo: boolean;
  // Solo los nombres de archivo, no las imagenes.
  // La URL sale de peliculaService.urlImagen(nombre)
  imagenes: string[];
}

//Cuerpo del formulario de nueva pelicula.
export interface CrearPelicula {
  titulo: string;
  sinopsis: string;
  duracionMinutos: number;
  /** Formato AAAA-MM-DD */
  fechaEstreno: string;
  activo: boolean;
}

//Respuesta real de POST /peliculas, verificada contra el backend.
export interface PeliculaCreada {
  id: number;
  titulo: string;
  sinopsis: string;
  duracion: number;
  fecha: string;
  activo?: boolean;
  imagenes?: unknown[];
}
