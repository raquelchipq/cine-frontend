/**
 * Edicion de una pelicula (solo ADMIN o GERENTE).
 *
 * Reutiliza el mismo esquema del alta. La diferencia es clave: aqui las
 * imagenes son opcionales. Si no se elige ninguna se conservan las actuales;
 * si se elige una o mas, el backend reemplaza las anteriores.
 */
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinners';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/common/container';
import {
  getPeliculaNuevaSchema,
  PeliculaNuevaSchemaType,
} from '../panel/pelicula-nueva-schema';

// Las mismas reglas del backend, para avisar antes de gastar una peticion
const MAX_IMAGENES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];

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

export function PeliculaEditarPage() {
  const { id } = useParams<{ id: string }>();
  const idPelicula = Number(id);
  const navigate = useNavigate();

  const [actual, setActual] = useState<Pelicula>();
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const form = useForm<PeliculaNuevaSchemaType>({
    resolver: zodResolver(getPeliculaNuevaSchema()),
    defaultValues: {
      titulo: '',
      sinopsis: '',
      duracionMinutos: 120,
      fechaEstreno: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (!Number.isInteger(idPelicula) || idPelicula < 1) {
      setCargando(false);
      return;
    }

    let vigente = true;

    peliculaService
      .obtenerPelicula(idPelicula)
      .then((pelicula) => {
        if (!vigente || !pelicula) return;
        setActual(pelicula);
        form.reset({
          titulo: pelicula.titulo,
          sinopsis: pelicula.sinopsis,
          duracionMinutos: pelicula.duracionMinutos,
          fechaEstreno: pelicula.fechaEstreno,
          activo: pelicula.activo,
        });
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
  }, [idPelicula, form]);

  // Las URL se crean una sola vez por seleccion, no en cada render
  const previews = useMemo(
    () => imagenes.map((archivo) => URL.createObjectURL(archivo)),
    [imagenes],
  );

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleArchivos = (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    const problema = validarImagenes(archivos);

    if (problema) {
      setError(problema);
      setImagenes([]);
      e.target.value = '';
      return;
    }

    setError(null);
    setImagenes(archivos);
  };

  const onSubmit = async (values: PeliculaNuevaSchemaType) => {
    setError(null);

    const problema = validarImagenes(imagenes);
    if (problema) {
      setError(problema);
      return;
    }

    setEnviando(true);
    try {
      await peliculaService.actualizar(idPelicula, values, imagenes);
      toast.success('Pelicula actualizada');
      navigate('/peliculas');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar la pelicula',
      );
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <Container>
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4 animate-spin" />
          Cargando pelicula...
        </div>
      </Container>
    );
  }

  if (!actual) {
    return (
      <Container>
        <div className="space-y-2 py-8">
          <p>No se encontro esa pelicula</p>
          <Link to="/peliculas" className="text-sm text-primary hover:underline">
            Volver al listado
          </Link>
        </div>
      </Container>
    );
  }

  const posterActual = actual.imagenes[0];

  return (
    <Container>
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <div className="space-y-1">
          <Link
            to="/peliculas"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar pelicula
          </h1>
          <p className="text-sm text-muted-foreground">
            Cambia los datos o reemplaza el poster. Las imagenes actuales se
            conservan si no eliges nuevas.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle className="h-4 w-4" />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {/* Imagen actual, para saber que se va a reemplazar */}
        {posterActual && (
          <div className="space-y-2">
            <Label>Imagen actual</Label>
            <img
              src={peliculaService.urlImagen(posterActual)}
              alt={actual.titulo}
              className="h-40 w-28 rounded border border-border object-cover"
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input disabled={enviando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sinopsis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sinopsis</FormLabel>
                  <FormControl>
                    <Textarea rows={3} disabled={enviando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duracionMinutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duracion (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        disabled={enviando}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaEstreno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de estreno</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={enviando} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={enviando}
                    />
                  </FormControl>
                  <FormLabel>Activo</FormLabel>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="imagenes">
                Reemplazar imagenes (hasta 5, max 5 MiB c/u)
              </Label>
              <Input
                id="imagenes"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={enviando}
                onChange={handleArchivos}
              />
              <p className="text-xs text-muted-foreground">
                Si no eliges archivos, se mantiene la imagen actual.
              </p>
            </div>

            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previews.map((url, idx) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Vista previa ${idx + 1}`}
                    className="h-16 w-16 rounded border border-border object-cover"
                  />
                ))}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
              {enviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </Form>
      </div>
    </Container>
  );
}
