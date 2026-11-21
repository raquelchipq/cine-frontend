import { CrearReserva, ReservaCreada, Reserva } from '@/types/reserva';
import { http } from '@/lib/http';

/**
 * Llamadas al recurso de reservas.
 *
 * POST /reservas exige rol CLIENTE: si el token no lo trae, el backend
 * responde 403 y ese mensaje se muestra tal cual. Los asientos se validan otra
 * vez en el servidor, por eso un 409 significa que alguien se adelanto.
 */
export const reservaService = {
  async crear(reserva: CrearReserva): Promise<ReservaCreada> {
    const { data } = await http.post<{
      status: string;
      message?: string;
      data: ReservaCreada;
    }>('/reservas', reserva);

    return data.data;
  },

  async listarMisReservas(): Promise<Reserva[]> {
    const { data } = await http.get<{
      status: string;
      data: Reserva[];
    }>('/reservas/cliente');

    return data.data || [];
  },
};
