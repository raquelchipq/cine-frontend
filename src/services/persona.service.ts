import { RespuestaPaginada } from '@/types/paginacion';
import {
  PersonaListada,
  PersonaRegistrada,
  RegistrarPersona,
} from '@/types/persona';
import { http } from '@/lib/http';

/**
 * Llamadas al recurso de personas.
 *
 * `registrar` usa POST /persona, que es publico y crea de una sola vez la
 * persona, su usuario y su cliente. `listar` y `buscar` son del panel: el
 * backend exige rol ADMIN o GERENTE.
 */
export const personaService = {
  async registrar(datos: RegistrarPersona): Promise<PersonaRegistrada> {
    const { data } = await http.post<{
      status: string;
      message?: string;
      data: PersonaRegistrada;
    }>('/persona', datos);

    return data.data;
  },

  /**
   * Alta de un gerente con POST /persona/gerente (solo ADMIN o GERENTE). El
   * backend fuerza el rol 2 aunque se envie otro; el cuerpo es el mismo del
   * registro publico.
   */
  async registrarGerente(datos: RegistrarPersona): Promise<PersonaRegistrada> {
    const { data } = await http.post<{
      status: string;
      message?: string;
      data: PersonaRegistrada;
    }>('/persona/gerente', datos);

    return data.data;
  },

  async listar(
    pagina = 1,
    porPagina = 10,
  ): Promise<RespuestaPaginada<PersonaListada>> {
    const { data } = await http.get<RespuestaPaginada<PersonaListada>>(
      '/persona',
      { params: { pagina, porPagina } },
    );
    return data;
  },

  /**
   * Busca por nombres y/o apellidos (el backend exige al menos uno) y devuelve
   * el mismo paginado que `listar`.
   */
  async buscar(
    nombres: string,
    apellidos: string,
    pagina = 1,
    porPagina = 10,
  ): Promise<RespuestaPaginada<PersonaListada>> {
    const { data } = await http.get<RespuestaPaginada<PersonaListada>>(
      '/persona/buscar',
      {
        params: {
          nombres: nombres.trim() || undefined,
          apellidos: apellidos.trim() || undefined,
          pagina,
          porPagina,
        },
      },
    );

    return data;
  },
};
