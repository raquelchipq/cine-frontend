import { z } from 'zod';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Un solo horario del alta.
 *
 * Una pelicula suele proyectarse varias veces al dia, asi que el formulario
 * carga una lista de horarios y el servicio crea una funcion por cada uno.
 */
const horario = z
  .object({
    horaInicio: z.string().regex(HORA, { message: 'Usa el formato HH:mm' }),
    horaFin: z.string().regex(HORA, { message: 'Usa el formato HH:mm' }),
  })
  .refine((datos) => datos.horaFin > datos.horaInicio, {
    message: 'La hora de fin debe ser posterior a la de inicio',
    path: ['horaFin'],
  });

/**
 * Reglas del alta de funcion.
 *
 * Repiten lo que valida el backend (fecha con formato, fin posterior al inicio
 * y precio positivo) para avisar antes de gastar peticiones. Ademas se controla
 * aca lo que el backend no puede ver entre funciones sueltas: que los horarios
 * no se pisen entre si ni con el fin de la sala.
 */
export const getFuncionNuevaSchema = () =>
  z
    .object({
      idPelicula: z.coerce
        .number()
        .int()
        .positive({ message: 'Elige una pelicula' }),
      idSala: z.coerce.number().int().positive({ message: 'Elige una sala' }),
      fecha: z.string().regex(FECHA, { message: 'Usa el formato AAAA-MM-DD' }),
      horarios: z
        .array(horario)
        .min(1, { message: 'Agrega al menos un horario' })
        .max(12, { message: 'Maximo 12 horarios por tanda' }),
      precio: z.coerce
        .number()
        .positive({ message: 'El precio debe ser mayor que cero' })
        .max(99999999.99, { message: 'El precio es demasiado alto' }),
    })
    .refine(
      (datos) => {
        // Dos funciones no pueden empezar a la misma hora en la misma sala
        const inicios = datos.horarios.map((h) => h.horaInicio);
        return new Set(inicios).size === inicios.length;
      },
      {
        message: 'Hay dos horarios que empiezan a la misma hora',
        path: ['horarios'],
      },
    )
    .refine(
      (datos) => {
        // Y una no puede empezar antes de que termine la anterior
        const ordenados = [...datos.horarios].sort((a, b) =>
          a.horaInicio.localeCompare(b.horaInicio),
        );
        return ordenados.every(
          (actual, i) =>
            i === 0 || actual.horaInicio >= ordenados[i - 1].horaFin,
        );
      },
      { message: 'Los horarios se superponen en la sala', path: ['horarios'] },
    );

export type FuncionNuevaSchemaType = z.infer<
  ReturnType<typeof getFuncionNuevaSchema>
>;

export type HorarioType = FuncionNuevaSchemaType['horarios'][number];
