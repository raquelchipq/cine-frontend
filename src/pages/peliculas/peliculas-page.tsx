/**
 * Catalogo de peliculas.
 *
 * El alta vive aca dentro: el boton se muestra solo a ADMIN o GERENTE, que son
 * los roles que el backend acepta en POST /peliculas.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { Pencil, Plus } from 'lucide-react';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { Link } from 'react-router-dom';

/** Los mismos roles que exige el backend para crear peliculas. */
const ROLES_ALTA = ['ADMIN', 'GERENTE'];

function formatearDuracion(minutos:number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas > 0 ? `${horas}h ${resto}m`  : `${resto}m`
}


export function PeliculasPage() {
    const { user } = useAuth();
    const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const puedeCrear = user?.roles.some((rol) => ROLES_ALTA.includes(rol)) ?? false;

    useEffect(() => {
        peliculaService.listarPeliculas()
            .then((respuesta) => setPeliculas(respuesta.data))
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [])

    return (
        <Container>
            <div className='space-y-6 py-8'>

                <div className='flex flex-wrap items-end justify-between gap-3'>
                    <h1>Peliculas</h1>

                    {/* El alta esta en el listado: no hace falta una entrada aparte */}
                    {puedeCrear && (
                        <Button asChild>
                            <Link to='/peliculas/nueva'>
                                <Plus />
                                Nueva pelicula
                            </Link>
                        </Button>
                    )}
                </div>

                {cargando ? (
                    <p>Cargando pelicula....</p>
                ) : error ? (
                    <p>{error}</p>
                ) : peliculas.length === 0 ? (
                    <p>No hay peliculas en la cartelera</p>
                ) : (
                    <div className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4'>
                        {peliculas.map((pelicula) => {
                            const poster = pelicula.imagenes[0];

                            return (
                                <article key={pelicula.id} className="group relative">

                                    {/* Link para darle click */}
                                    <Link to={`/peliculas/${pelicula.id}`}>
                                        {/* aspect-[2/3] es la proporcion de un afiche de cine */}
                                        <div className="overflow-hidden rounded-lg bg-muted aspect-[2/3]">
                                            {poster ? (
                                                <img src={peliculaService.urlImagen(poster)}
                                                    alt={pelicula.titulo}
                                                    // loading lazy: no descarga las imagenes de abajo
                                                    // hasta que el usuario llegue a ellas
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                                                    Sin imagen
                                                </div>
                                            )}
                                        </div>

                                        <h2 className="mt-3 text-sm font-medium leading-tight text-mono">
                                            {pelicula.titulo}
                                        </h2>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatearDuracion(pelicula.duracionMinutos)}
                                        </p>
                                    </Link>

                                    {/* Editar (datos y poster): solo ADMIN o GERENTE */}
                                    {puedeCrear && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="secondary"
                                            className="absolute right-2 top-2 h-8 gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                        >
                                            <Link to={`/peliculas/${pelicula.id}/editar`}>
                                                <Pencil className="h-3.5 w-3.5" />
                                                Editar
                                            </Link>
                                        </Button>
                                    )}

                                </article>

                            )
                        })}
                    </div>
                )}
            </div>
        </Container>
    );
}
