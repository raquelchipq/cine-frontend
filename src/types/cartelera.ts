/**
 * Forma de los datos de cartelera.
 *
 * `Funcion` es lo que devuelve GET /cartelera/funciones y `Sala` lo de
 * GET /cartelera/salas. `CrearFuncion` es el cuerpo de POST /cartelera/funciones
 * (solo ADMIN o GERENTE) y `FuncionCreada` su respuesta, que agrega idFuncion.
 */
export interface Funcion {
  idFuncion: number;
  idPelicula: number;
  pelicula: string;
  idSala: number;
  sala: string;
  tipoSala: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:mm:ss */
  horaInicio: string;
  horaFin: string;
  precio: number;
  estado: string;
}

export interface Sala {
  idSala: number;
  nombre: string;
  capacidad: number;
  tipo: string;
  activa: boolean;
}

/**
 * Cuerpo de POST /cartelera/funciones.
 *
 * Las horas se manejan en HH:mm, que es lo que da el input time; agregar los
 * segundos que pide el backend es trabajo del servicio.
 */
export interface CrearFuncion {
  idPelicula: number;
  idSala: number;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:mm */
  horaInicio: string;
  horaFin: string;
  precio: number;
}

export interface FuncionCreada extends CrearFuncion {
  idFuncion: number;
}
