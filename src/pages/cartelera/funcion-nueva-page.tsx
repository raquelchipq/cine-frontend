/**
 * Alta de funciones (solo ADMIN o GERENTE).
 *
 * Una misma pelicula suele proyectarse varias veces al dia, asi que el
 * formulario carga una lista de horarios y las crea todas de una: no hay que
 * repetir el alta por cada funcion.
 *
 * El formulario no arma la peticion: eso queda en carteleraService, que pide
 * las funciones en paralelo y resume cuantas se guardaron.
 */
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CrearFuncion, Sala } from '@/types/cartelera';
import { Pelicula } from '@/types/pelicula';
import { horaCorta, hoy, moneda } from '@/lib/formato';
import { carteleraService } from '@/services/cartelera.service';
import { peliculaService } from '@/services/pelicula.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinners';
import { Container } from '@/components/common/container';
import {
  FuncionNuevaSchemaType,
  getFuncionNuevaSchema,
} from './funcion-nueva-schema';

/** Solo para sugerir la hora de fin al agregar un horario */
const DURACION_POR_DEFECTO = 2;
const MINUTOS_DEL_DIA = 24 * 60;

/** Suma horas a un 'HH:mm' sin pasarse de las 23:59 */
function sumarHoras(hora: string, horas: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = Math.min(h * 60 + m + horas * 60, MINUTOS_DEL_DIA - 1);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function FuncionNuevaPage() {
  const navigate = useNavigate();
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const form = useForm<FuncionNuevaSchemaType>({
    resolver: zodResolver(getFuncionNuevaSchema()),
    defaultValues: {
      idPelicula: 0,
      idSala: 0,
      fecha: hoy(),
      horarios: [{ horaInicio: '19:00', horaFin: '21:00' }],
      precio: 35,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'horarios',
  });

  useEffect(() => {
    let vigente = true;

    // Las dos listas se piden juntas: sin pelicula o sin sala no hay alta
    Promise.all([
      peliculaService.listarPeliculas(1, 100),
      carteleraService.listarSalas(),
    ])
      .then(([respuestaPeliculas, respuestaSalas]) => {
        if (!vigente) return;

        // El backend rechaza peliculas y salas inactivas
        setPeliculas(respuestaPeliculas.data.filter((p) => p.activo));
        setSalas(respuestaSalas.filter((s) => s.activa));
      })
      .catch((err) => {
        if (vigente) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar peliculas y salas',
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

  const onSubmit = async (values: FuncionNuevaSchemaType) => {
    setError(null);
    setEnviando(true);

    // Una funcion por horario: mismo titulo, misma sala, mismo precio
    const funciones: CrearFuncion[] = values.horarios.map((horario) => ({
      idPelicula: values.idPelicula,
      idSala: values.idSala,
      fecha: values.fecha,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      precio: values.precio,
    }));

    try {
      const { creadas, fallidas } =
        await carteleraService.crearFunciones(funciones);

      if (fallidas.length === 0) {
        toast.success(
          creadas.length === 1
            ? 'Funcion registrada'
            : `${creadas.length} funciones registradas`,
        );
        navigate('/cartelera');
        return;
      }

      // Hubo choques: se avisa cada una y no se pierde lo que si entro
      setError(
        `${creadas.length} de ${funciones.length} funciones se guardaron. ` +
          fallidas
            .map((f) => `${horaCorta(f.horaInicio)}: ${f.mensaje}`)
            .join(' | '),
      );

      // Lo que fallo queda cargado para corregir y reintentar
      form.setValue(
        'horarios',
        values.horarios.filter((h) =>
          fallidas.some((f) => f.horaInicio === h.horaInicio),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al registrar las funciones',
      );
    } finally {
      setEnviando(false);
    }
  };

  const agregarHorario = () => {
    const horarios = form.getValues('horarios');
    const ultimo = horarios[horarios.length - 1];
    // Se sugiere el horario siguiente al ultimo cargado, para no teclear todo
    append({
      horaInicio: ultimo ? ultimo.horaFin : '19:00',
      horaFin: sumarHoras(
        ultimo ? ultimo.horaFin : '19:00',
        DURACION_POR_DEFECTO,
      ),
    });
  };

  // Sin pelicula o sin sala el formulario no tiene nada que ofrecer
  const noHayOpciones =
    !cargando && (peliculas.length === 0 || salas.length === 0);

  const horarios = form.watch('horarios');
  const precio = form.watch('precio');

  return (
    <Container>
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div className="space-y-1">
          <Link
            to="/cartelera"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la cartelera
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nueva funcion
          </h1>
          <p className="text-sm text-muted-foreground">
            Una funcion une una pelicula con una sala, un dia y un horario. Si
            se proyecta varias veces ese dia, agrega un horario por cada una.
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

        {cargando ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4 animate-spin" />
            Cargando peliculas y salas...
          </div>
        ) : noHayOpciones ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Para dar de alta una funcion hace falta al menos una pelicula activa
            y una sala activa.
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="idPelicula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pelicula</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(valor) => field.onChange(Number(valor))}
                        disabled={enviando}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Elige una pelicula" />
                        </SelectTrigger>
                        <SelectContent>
                          {peliculas.map((pelicula) => (
                            <SelectItem
                              key={pelicula.id}
                              value={String(pelicula.id)}
                            >
                              {pelicula.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="idSala"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sala</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : undefined}
                          onValueChange={(valor) =>
                            field.onChange(Number(valor))
                          }
                          disabled={enviando}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Elige una sala" />
                          </SelectTrigger>
                          <SelectContent>
                            {salas.map((sala) => (
                              <SelectItem
                                key={sala.idSala}
                                value={String(sala.idSala)}
                              >
                                {sala.nombre} - {sala.tipo} ({sala.capacidad}{' '}
                                butacas)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={enviando} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium">Horarios de ese dia</h2>
                    <p className="text-xs text-muted-foreground">
                      Se crea una funcion por cada horario.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={enviando || fields.length >= 12}
                    onClick={agregarHorario}
                  >
                    <Plus />
                    Agregar horario
                  </Button>
                </div>

                {fields.map((field, indice) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <span className="mb-2 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {indice + 1}
                    </span>

                    <FormField
                      control={form.control}
                      name={`horarios.${indice}.horaInicio`}
                      render={({ field: campo }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Desde</FormLabel>
                          <FormControl>
                            <Input type="time" disabled={enviando} {...campo} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`horarios.${indice}.horaFin`}
                      render={({ field: campo }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Hasta</FormLabel>
                          <FormControl>
                            <Input type="time" disabled={enviando} {...campo} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mb-1 text-muted-foreground hover:text-destructive"
                      disabled={enviando || fields.length === 1}
                      aria-label={`Quitar horario ${indice + 1}`}
                      onClick={() => remove(indice)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}

                <FormMessage>
                  {form.formState.errors.horarios?.message}
                </FormMessage>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por butaca (Bs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={enviando}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resumen antes de guardar: evita cargar una tanda a ciegas */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                Se crearan <strong>{horarios.length}</strong>{' '}
                {horarios.length === 1 ? 'funcion' : 'funciones'} a{' '}
                {moneda(Number(precio) || 0)} cada una.
              </div>

              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
                {enviando
                  ? 'Guardando...'
                  : horarios.length === 1
                    ? 'Guardar funcion'
                    : `Guardar ${horarios.length} funciones`}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </Container>
  );
}
