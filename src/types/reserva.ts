/**
 * Forma de los datos de la reserva.
 *
 * `Asiento` es lo que devuelve GET /cartelera/funciones/:idFuncion/asientos y
 * `CrearReserva` lo que espera POST /reservas, que solo acepta rol CLIENTE.
 */
export interface Asiento {
  idAsiento: number;
  idSala: number;
  sala: string;
  fila: string;
  numero: number;
  asiento: string;
  tipo: string;
  activo: boolean;
  /** Solo viene al consultar por funcion: dice si la butaca se puede elegir */
  disponible?: boolean;
}

export interface DetalleReserva {
  idAsiento: number;
  precio: number;
}

export interface CrearReserva {
  /** El id del token es el de la persona, que es la clave del cliente */
  idCliente: number;
  idFuncion: number;
  /** Fecha ISO 8601 */
  fechaReserva: string;
  codigoReserva: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
  total: number;
  detalles: DetalleReserva[];
}

/** Respuesta real de POST /reservas: la reserva guardada y sus detalles */
export interface ReservaCreada {
  reserva: {
    id: number;
    idCliente: number;
    idFuncion: number;
    fechaReserva: string;
    codigo: string;
    estado: string;
    total: number;
  };
  detalles: DetalleReserva[];
}

/** Reserva mostrada en "Mis reservas" */
export interface Reserva {
  idReserva: number;
  codigoReserva?: string;
  pelicula: string;
  sala: string;
  tipoSala: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  total: number;
  cantidadAsientos?: number;
  asientos?: Array<{ asiento: string; fila?: string; numero?: number }>;
}
