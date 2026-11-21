/**
 * Forma comun de los listados paginados de la API.
 *
 * GET /peliculas y GET /persona devuelven la misma estructura: solo cambia T.
 */
export interface RespuestaPaginada<T> {
  status: string;
  message?: string;
  data: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}
