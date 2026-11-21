import { RespuestaPaginada } from '@/types/paginacion';
import { CrearPelicula, Pelicula, PeliculaCreada } from '@/types/pelicula';
import { env } from '@/config/env';
import { http } from '@/lib/http';

/**
 * Llamadas al recurso de peliculas.
 *
 * La pantalla no conoce axios ni escribe URLs: solo llama a estos metodos.
 */
export const peliculaService = {
  async listarPeliculas(
    pagina = 1,
    porPagina = 20,
  ): Promise<RespuestaPaginada<Pelicula>> {
    const { data } = await http.get<RespuestaPaginada<Pelicula>>('/peliculas', {
      params: { pagina, porPagina },
    });
    return data;
  },

  // No hay endpoint de detalle: la pelicula se busca dentro del listado
  async obtenerPelicula(id: number): Promise<Pelicula | undefined> {
    const respuesta = await this.listarPeliculas(1, 100);
    return respuesta.data.find((p) => p.id === id);
  },

  // URL del poster; el backend sirve los archivos aparte de la API
  urlImagen(nombreArchivo: string): string {
    return `${env.apiUrl}/files/pelicula/${nombreArchivo}`;
  },

  /**
   * Crea la pelicula junto con sus imagenes (Tarea 4).
   *
   * El FormData se arma aca y no en la pantalla, para que la pantalla siga sin
   * saber como viaja la peticion. Cada imagen va en un campo `imagenes`
   * repetido, que es lo que espera el backend.
   */
  async crear(
    pelicula: CrearPelicula,
    imagenes: File[],
  ): Promise<PeliculaCreada> {
    const datos = new FormData();

    datos.append('titulo', pelicula.titulo);
    datos.append('sinopsis', pelicula.sinopsis);
    datos.append('duracionMinutos', String(pelicula.duracionMinutos));
    datos.append('fechaEstreno', pelicula.fechaEstreno);
    datos.append('activo', String(pelicula.activo));

    for (const imagen of imagenes) {
      datos.append('imagenes', imagen);
    }

    // OJO: no se toca Content-Type. Con un FormData axios pone
    // multipart/form-data y su boundary solo; si se fuerza, el backend no
    // recibe los archivos.
    const { data } = await http.post<{
      status: string;
      message?: string;
      data: PeliculaCreada;
    }>('/peliculas', datos);

    return data.data;
  },

  /**
   * Actualiza una pelicula (solo ADMIN o GERENTE).
   *
   * Si llegan imagenes, el backend reemplaza las anteriores; si no, las
   * conserva. Mismo criterio que `crear` con el FormData y el Content-Type.
   */
  async actualizar(
    id: number,
    pelicula: CrearPelicula,
    imagenes: File[] = [],
  ): Promise<PeliculaCreada> {
    const datos = new FormData();

    datos.append('titulo', pelicula.titulo);
    datos.append('sinopsis', pelicula.sinopsis);
    datos.append('duracionMinutos', String(pelicula.duracionMinutos));
    datos.append('fechaEstreno', pelicula.fechaEstreno);
    datos.append('activo', String(pelicula.activo));

    for (const imagen of imagenes) {
      datos.append('imagenes', imagen);
    }

    const { data } = await http.put<{
      status: string;
      message?: string;
      data: PeliculaCreada;
    }>(`/peliculas/${id}`, datos);

    return data.data;
  },
};
