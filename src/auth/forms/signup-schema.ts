import { z } from 'zod';

/**
 * Validacion del formulario de registro.
 *
 * Repite las reglas de POST /persona (publico): la contrasena va de 6 a 50
 * caracteres y `constrasena` se escribe asi porque asi se llama en el backend.
 */
export const getSignupSchema = () =>
  z.object({
    nombres: z.string().min(1, { message: 'Ingresa tus nombres' }),
    apellidos: z.string().min(1, { message: 'Ingresa tus apellidos' }),
    documento: z.string().min(1, { message: 'Ingresa tu documento' }),
    telefono: z.string().min(1, { message: 'Ingresa tu telefono' }),
    email: z.string().email({ message: 'Ingresa un correo valido' }),
    fechaNacimiento: z
      .string()
      .min(1, { message: 'Elige tu fecha de nacimiento' }),
    usuario: z.string().min(1, { message: 'Elige un usuario' }),
    constrasena: z
      .string()
      .min(6, { message: 'Minimo 6 caracteres' })
      .max(50, { message: 'Maximo 50 caracteres' }),
  });

export type SignupSchemaType = z.infer<ReturnType<typeof getSignupSchema>>;
