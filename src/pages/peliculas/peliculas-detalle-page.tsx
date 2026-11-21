/**
 * Detalle de una pelicula: poster, sinopsis y sus funciones.
 *
 * Cada funcion lleva a /reservar/:idFuncion, que es donde se eligen las
 * butacas. Si el id de la URL no sirve no se consulta nada: Number('nueva') da
 * NaN y el backend responde 400 (idPelicula debe ser un entero >= 1).
 *
 * ADMIN y GERENTE ven ademas un boton para subir o cambiar el poster sin salir
 * de la pagina: eligen el archivo y se sube al instante (PUT /peliculas/:id).
 */
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ImageUp } from 'lucide-react';
import { toast } from 'sonner';
import { Funcion } from '@/types/cartelera';
import { Pelicula } from '@/types/pelicula';
import { fechaCorta, horaCorta, moneda } from '@/lib/formato';
import { useAuth } from '@/auth/context/auth-context';
import { carteleraService } from '@/services/cartelera.service';
import { peliculaService } from '@/services/pelicula.service';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinners';
import { Container } from '@/components/common/container';

/** Roles con permiso para tocar el catalogo (los mismos del backend). */
const ROLES_GESTION = ['ADMIN', 'GERENTE'];

// Mismas reglas del backend, para avisar antes de gastar una peticion
const MAX_IMAGENES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];

/** Devuelve un mensaje de error, o null si los archivos sirven. */
function validarImagenes(archivos: File[]): string | null {
  if (archivos.length > MAX_IMAGENES) {
    return `Maximo ${MAX_IMAGENES} imagenes (elegiste ${archivos.length}).`;
  }

  for (const archivo of archivos) {
    const ext = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES.includes(ext)) {
      return `"${archivo.name}": formato no permitido (solo .jpg .jpeg .png .webp).`;
    }
    if (archivo.size > MAX_BYTES) {
      return `"${archivo.name}" supera los 5 MiB.`;
    }
  }

  return null;
}

/**
 * Agrupa las funciones por fecha y las ordena por hora.
 *
 * En el detalle de la pelicula se quiere ver "que dias se presenta y a que
 * horas", asi que las funciones se listan juntas por fecha en vez de como
 * tarjetas sueltas repetidas.
 */
function agruparPorFecha(funciones: Funcion[]): { fecha: string; items: Funcion[] }[] {
  const porFecha = new Map<string, Funcion[]>();

  for (const funcion of funciones) {
    const dia = funcion.fecha.slice(0, 10);
    const lista = porFecha.get(dia);
    if (lista) {
      lista.push(funcion);
    } else {
      porFecha.set(dia, [funcion]);
    }
  }

  return Array.from(porFecha.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, items]) => ({
      fecha,
      items: items.sort((a, b) =>
        a.horaInicio.localeCompare(b.horaInicio),
      ),
    }));
}

export function PeliculasDellatePage() {
  const { id } = useParams<{ id: string }>();
  const idPelicula = Number(id);
  const { user } = useAuth();
  const [pelicula, setPelicula] = useState<Pelicula>();
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputImagen = useRef<HTMLInputElement>(null);

  // Solo ADMIN y GERENTE pueden cambiar el poster; el backend lo exige igual
  const puedeGestionar =
    user?.roles.some((rol) => ROLES_GESTION.includes(rol)) ?? false;

  useEffect(() => {
    // Un id que no sea entero positivo no se consulta: el backend lo rechaza
    if (!Number.isInteger(idPelicula) || idPelicula < 1) {
      setCargando(false);
      return;
    }

    let vigente = true;
    setCargando(true);

    Promise.all([
      peliculaService.obtenerPelicula(idPelicula),
      carteleraService.listarFunciones(idPelicula),
    ])
      .then(([peliculaHallada, funcionesHalladas]) => {
        if (!vigente) return;
        setPelicula(peliculaHallada);
        setFunciones(funcionesHalladas);
      })
      .catch((err: Error) => {
        if (vigente) setError(err.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [idPelicula]);

  /**
   * Sube el poster elegido y refresca la misma pantalla.
   *
   * Se manda la pelicula completa porque el PUT reemplaza todos los campos: lo
   * que no viaje se perderia. Con las imagenes, el backend reemplaza las
   * anteriores.
   */
  const handleImagen = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    // Se limpia enseguida para poder volver a elegir el mismo archivo
    e.target.value = '';
    if (archivos.length === 0 || !pelicula) return;

    const problema = validarImagenes(archivos);
    if (problema) {
      toast.error(problema);
      return;
    }

    setSubiendo(true);
    try {
      await peliculaService.actualizar(
        pelicula.id,
        {
          titulo: pelicula.titulo,
          sinopsis: pelicula.sinopsis,
          duracionMinutos: pelicula.duracionMinutos,
          fechaEstreno: pelicula.fechaEstreno.slice(0, 10),
          activo: pelicula.activo,
        },
        archivos,
      );

      const actualizada = await peliculaService.obtenerPelicula(pelicula.id);
      if (actualizada) setPelicula(actualizada);

      toast.success('Imagen actualizada');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo subir la imagen',
      );
    } finally {
      setSubiendo(false);
    }
  };

  if (cargando) {
    return (
      <Container>
        <p>Cargando pelicula....</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <p>{error}</p>
      </Container>
    );
  }

  if (!pelicula) {
    return (
      <Container>
        <p>No se encontro esa pelicula</p>
        <Link to="/peliculas">Volver al listado</Link>
      </Container>
    );
  }

  const poster = pelicula.imagenes[0];

  return (
    <Container>
      <div className="py-8">
        <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
              {poster ? (
                <img
                  src={peliculaService.urlImagen(poster)}
                  alt={pelicula.titulo}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Subir o cambiar el poster sin salir de la pelicula */}
            {puedeGestionar && (
              <>
                <input
                  ref={inputImagen}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImagen}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={subiendo}
                  onClick={() => inputImagen.current?.click()}
                >
                  {subiendo ? (
                    <Spinner className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageUp className="me-2 h-4 w-4" />
                  )}
                  {subiendo
                    ? 'Subiendo...'
                    : poster
                      ? 'Cambiar imagen'
                      : 'Cargar imagen'}
                </Button>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-mono">
                {pelicula.titulo}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Estreno {fechaCorta(pelicula.fechaEstreno)}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-secondary-foreground">
              {pelicula.sinopsis}
            </p>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-mono">
                Horarios
              </h2>

              {funciones.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No hay funciones programadas
                </p>
              ) : (
                <div className="mt-3 space-y-5">
                  {agruparPorFecha(funciones).map((grupo) => (
                    <div key={grupo.fecha} className="space-y-2">
                      <p className="text-sm font-medium text-mono">
                        {fechaCorta(grupo.fecha)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {grupo.items.map((funcion) => {
                          const cancelada = funcion.estado === 'CANCELADA';

                          return (
                            <div
                              key={funcion.idFuncion}
                              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-mono">
                                  {horaCorta(funcion.horaInicio)} -{' '}
                                  {horaCorta(funcion.horaFin)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {funcion.sala} - {funcion.tipoSala}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {moneda(funcion.precio)}
                                </span>
                                {cancelada ? (
                                  <span className="text-xs text-muted-foreground">
                                    No disponible
                                  </span>
                                ) : (
                                  <Button asChild size="sm" variant="outline">
                                    <Link to={`/reservar/${funcion.idFuncion}`}>
                                      Elegir butacas
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
