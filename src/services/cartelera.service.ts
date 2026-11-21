import { CrearFuncion, Funcion, FuncionCreada, Sala } from '@/types/cartelera';
import { Asiento } from '@/types/reserva';
import { http } from '@/lib/http';

/**
 * Llamadas al recurso de cartelera.
 *
 * Las pantallas no conocen axios ni escriben URLs: solo llaman a estos metodos.
 */
export const carteleraService = {
  /** Funciones con pelicula, sala, horario y precio. */
  async listarFunciones(idPelicula?: number): Promise<Funcion[]> {
    const { data } = await http.get<Funcion[]>('/cartelera/funciones', {
      params: { idPelicula },
    });
    return data;
  },

  /** Asientos de una funcion; el backend ya marca `disponible`. */
  async listarAsientos(idFuncion: number): Promise<Asiento[]> {
    const { data } = await http.get<Asiento[]>(
      `/cartelera/funciones/${idFuncion}/asientos`,
    );
    return data;
  },

  /** Salas con su capacidad y tipo, para el alta de funciones. */
  async listarSalas(): Promise<Sala[]> {
    const { data } = await http.get<Sala[]>('/cartelera/salas');
    return data;
  },

  /**
   * Registra una funcion (solo ADMIN o GERENTE).
   *
   * El backend pide las horas en HH:mm:ss y el input time las da en HH:mm, asi
   * que los segundos se agregan aca y la pantalla no se entera.
   */
  async crearFuncion(funcion: CrearFuncion): Promise<FuncionCreada> {
    const { data } = await http.post<{
      status: string;
      message?: string;
      data: FuncionCreada;
    }>('/cartelera/funciones', {
      ...funcion,
      horaInicio: conSegundos(funcion.horaInicio),
      horaFin: conSegundos(funcion.horaFin),
      precio: redondear(funcion.precio),
    });

    return data.data;
  },

  /**
   * Alta de varios horarios de una misma pelicula y sala.
   *
   * El backend expone un POST por funcion, asi que se piden en paralelo; con
   * `allSettled` una sala ocupada no tumba al resto. Devuelve cuantas se
   * guardaron y los mensajes de las que fallaron, para avisar sin perder el
   * trabajo ya hecho.
   */
  async crearFunciones(
    funciones: CrearFuncion[],
  ): Promise<ResultadoAltaMultiple> {
    const resultados = await Promise.allSettled(
      funciones.map((funcion) => this.crearFuncion(funcion)),
    );

    const creadas = resultados
      .filter(
        (r): r is PromiseFulfilledResult<FuncionCreada> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);

    const fallidas = resultados
      .map((r, i) => ({ r, funcion: funciones[i] }))
      .filter(({ r }) => r.status === 'rejected')
      .map(({ r, funcion }) => ({
        horaInicio: funcion.horaInicio,
        mensaje: (r as PromiseRejectedResult).reason?.message ?? 'Error',
      }));

    return { creadas, fallidas };
  },
};

/** Resumen del alta multiple, para que la pantalla informe que paso. */
export interface ResultadoAltaMultiple {
  creadas: FuncionCreada[];
  fallidas: { horaInicio: string; mensaje: string }[];
}

/** '19:00' -> '19:00:00'; si ya trae segundos, no los duplica. */
function conSegundos(hora: string): string {
  return /^\d{2}:\d{2}$/.test(hora) ? `${hora}:00` : hora;
}

/** El backend guarda el precio con dos decimales. */
function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
