import { z } from 'zod';

export const getPeliculaNuevaSchema = () =>
  z.object({
    titulo: z.string().trim().min(1, { message: 'El titulo es obligatorio' }),
    sinopsis: z
      .string()
      .trim()
      .min(1, { message: 'La sinopsis es obligatoria' }),
    duracionMinutos: z.coerce
      .number()
      .int({ message: 'La duracion debe ser un entero' })
      .positive({ message: 'La duracion debe ser mayor que cero' }),
    fechaEstreno: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Usa el formato AAAA-MM-DD' }),
    activo: z.boolean(),
  });

export type PeliculaNuevaSchemaType = z.infer<
  ReturnType<typeof getPeliculaNuevaSchema>
>;
