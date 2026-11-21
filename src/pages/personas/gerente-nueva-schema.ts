import { getSignupSchema, SignupSchemaType } from '@/auth/forms/signup-schema';

/**
 * El alta de gerente manda el mismo cuerpo que el registro publico
 * (CreatePersonaDto): lo unico que cambia es el endpoint y el rol que asigna el
 * backend. Por eso se reutiliza el esquema del registro sin duplicar reglas.
 */
export const getGerenteNuevaSchema = getSignupSchema;
export type GerenteNuevaSchemaType = SignupSchemaType;
