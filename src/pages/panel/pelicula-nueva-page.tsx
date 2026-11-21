import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { hoy } from '@/lib/formato';
import { peliculaService } from '@/services/pelicula.service';
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
} from './pelicula-nueva-schema';

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

export function PeliculaNuevaPage() {
  const navigate = useNavigate();
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const form = useForm<PeliculaNuevaSchemaType>({
    resolver: zodResolver(getPeliculaNuevaSchema()),
    defaultValues: {
      titulo: '',
      sinopsis: '',
      duracionMinutos: 120,
      fechaEstreno: hoy(),
      activo: true,
    },
  });

  // Las URL se crean una sola vez por seleccion, no en cada render
  const previews = useMemo(
    () => imagenes.map((archivo) => URL.createObjectURL(archivo)),
    [imagenes],
  );

  // Libera la memoria de las URL anteriores al cambiar la seleccion
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleArchivos = (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    const problema = validarImagenes(archivos);

    if (problema) {
      // Si una imagen no sirve se descarta la seleccion entera y se limpia el
      // input, para que elegir de nuevo no arrastre el archivo malo
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

    // Los archivos no pasan por el esquema: se comprueban aqui
    const problema = validarImagenes(imagenes);
    if (problema) {
      setError(problema);
      return;
    }

    setEnviando(true);
    try {
      await peliculaService.crear(values, imagenes);
      navigate('/peliculas');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al registrar la pelicula',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Container>
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nueva pelicula
          </h1>
          <p className="text-sm text-muted-foreground">
            Los datos y las imagenes viajan en una sola peticion.
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="El nombre de la pelicula"
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
              name="sinopsis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sinopsis</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="De que trata"
                      disabled={enviando}
                      {...field}
                    />
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
                Imagenes (hasta 5, max 5 MiB c/u)
              </Label>
              <Input
                id="imagenes"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={enviando}
                onChange={handleArchivos}
              />
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
              {enviando ? 'Guardando...' : 'Guardar pelicula'}
            </Button>
          </form>
        </Form>
      </div>
    </Container>
  );
}
