/**
 * Cartelera publica: una tarjeta por pelicula.
 *
 * GET /cartelera/funciones devuelve una fila por funcion, asi que la misma
 * pelicula aparece varias veces (una por horario). Aca se agrupan por
 * idPelicula para mostrar una sola tarjeta con la lista de horarios; elegir la
 * funcion se hace en el detalle de la pelicula.
 *
 * Vive en la zona publica porque GET /cartelera/funciones no pide sesion: el
 * visitante ve la oferta completa. El boton de alta se le muestra solo a quien
 * tiene rol para crear funciones, y el backend lo vuelve a comprobar.
 *
 * GET /cartelera/funciones no trae la imagen: se pide el catalogo una sola vez
 * y se cruza por idPelicula, para no disparar una peticion por funcion.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { AlertCircle, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Funcion } from '@/types/cartelera';
import { horaCorta, moneda } from '@/lib/formato';
import { carteleraService } from '@/services/cartelera.service';
import { peliculaService } from '@/services/pelicula.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinners';
import { Container } from '@/components/common/container';

/** Los mismos roles que exige el backend para dar de alta funciones. */
const ROLES_ALTA = ['ADMIN', 'GERENTE'];

/** Cuantos horarios se muestran antes de resumir con "+N". */
const MAX_HORARIOS = 4;

/** Una pelicula de la cartelera, ya agrupada con todas sus funciones. */
interface PeliculaCartelera {
  idPelicula: number;
  titulo: string;
  funciones: Funcion[];
  /** Precio mas bajo entre sus funciones, para el "desde". */
  precioMinimo: number;
  /** Salas en las que se presenta, sin repetir. */
  salas: string[];
  /** Cuantas funciones siguen disponibles. */
  disponibles: number;
}

/**
 * Agrupa las funciones por pelicula conservando el orden de llegada.
 *
 * Se descartan las canceladas para el conteo y el precio, pero se conservan en
 * la lista para poder avisar de que existen.
 */
function agruparPorPelicula(funciones: Funcion[]): PeliculaCartelera[] {
  const porPelicula = new Map<number, PeliculaCartelera>();

  for (const funcion of funciones) {
    let entrada = porPelicula.get(funcion.idPelicula);

    if (!entrada) {
      entrada = {
        idPelicula: funcion.idPelicula,
        titulo: funcion.pelicula,
        funciones: [],
        precioMinimo: Number.POSITIVE_INFINITY,
        salas: [],
        disponibles: 0,
      };
      porPelicula.set(funcion.idPelicula, entrada);
    }

    entrada.funciones.push(funcion);

    if (funcion.estado === 'PROGRAMADA') {
      entrada.disponibles += 1;
      entrada.precioMinimo = Math.min(entrada.precioMinimo, funcion.precio);
      if (!entrada.salas.includes(funcion.sala)) {
        entrada.salas.push(funcion.sala);
      }
    }
  }

  // Una pelicula sin funciones programadas no tiene precio que mostrar
  for (const entrada of porPelicula.values()) {
    if (!Number.isFinite(entrada.precioMinimo)) {
      entrada.precioMinimo = 0;
    }
  }

  return Array.from(porPelicula.values());
}

export function CarteleraPage() {
  const { user } = useAuth();
  const [peliculas, setPeliculas] = useState<PeliculaCartelera[]>([]);
  // idPelicula -> nombre del poster (vacio si la pelicula no tiene imagen)
  const [posteres, setPosteres] = useState<Map<number, string | undefined>>(
    new Map(),
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const puedeCrear =
    user?.roles.some((rol) => ROLES_ALTA.includes(rol)) ?? false;

  useEffect(() => {
    // Si se sale de la pantalla antes de que responda la API no se toca el
    // estado de un componente que ya no esta montado
    let vigente = true;

    Promise.all([
      carteleraService.listarFunciones(),
      peliculaService.listarPeliculas(1, 100),
    ])
      .then(([datos, catalogo]) => {
        if (!vigente) return;

        setPeliculas(agruparPorPelicula(datos));
        setPosteres(
          new Map(
            catalogo.data.map((pelicula) => [
              pelicula.id,
              pelicula.imagenes[0],
            ]),
          ),
        );
      })
      .catch((err) => {
        if (vigente) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar la cartelera',
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Cartelera</h1>
            <p className="text-sm text-muted-foreground">
              Peliculas en cartel, con sus horarios y precios.
            </p>
          </div>

          {puedeCrear && (
            <Button asChild>
              <Link to="/cartelera/nueva">
                <CalendarPlus />
                Nueva funcion
              </Link>
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle className="h-4 w-4" />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {cargando ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4 animate-spin" />
            Cargando cartelera...
          </div>
        ) : peliculas.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Todavia no hay funciones cargadas.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {peliculas.map((pelicula) => {
              const poster = posteres.get(pelicula.idPelicula);
              const horarios = pelicula.funciones;
              const visibles = horarios.slice(0, MAX_HORARIOS);
              const restantes = horarios.length - visibles.length;

              return (
                <article
                  key={pelicula.idPelicula}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  {/* Imagen de la pelicula; sin archivo no se rompe la tarjeta */}
                  <Link
                    to={`/peliculas/${pelicula.idPelicula}`}
                    className="block aspect-[16/10] overflow-hidden bg-muted"
                  >
                    {poster ? (
                      <img
                        src={peliculaService.urlImagen(poster)}
                        alt={pelicula.titulo}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/peliculas/${pelicula.idPelicula}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {pelicula.titulo}
                      </Link>
                      {pelicula.salas.length > 0 && (
                        <Badge variant="secondary" className="shrink-0">
                          {pelicula.salas.join(' / ')}
                        </Badge>
                      )}
                    </div>

                    {/* Horarios de todas las funciones de esta pelicula */}
                    <div className="mt-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Horarios
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {visibles.map((funcion) => (
                          <span
                            key={funcion.idFuncion}
                            className={
                              funcion.estado === 'PROGRAMADA'
                                ? 'rounded-md border border-border bg-background px-2 py-0.5 text-sm'
                                : 'rounded-md border border-dashed border-border bg-muted px-2 py-0.5 text-sm text-muted-foreground line-through'
                            }
                            title={`${funcion.sala} - ${funcion.tipoSala}${
                              funcion.estado !== 'PROGRAMADA'
                                ? ` (${funcion.estado})`
                                : ''
                            }`}
                          >
                            {horaCorta(funcion.horaInicio)}
                          </span>
                        ))}
                        {restantes > 0 && (
                          <span className="rounded-md px-2 py-0.5 text-sm text-muted-foreground">
                            +{restantes} mas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
                      {pelicula.disponibles > 0 ? (
                        <span className="text-lg font-semibold text-primary">
                          <span className="text-xs font-normal text-muted-foreground">
                            desde{' '}
                          </span>
                          {moneda(pelicula.precioMinimo)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No disponible
                        </span>
                      )}

                      {/* El detalle tiene todas las funciones para elegir */}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/peliculas/${pelicula.idPelicula}`}>
                          Ver horarios
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
