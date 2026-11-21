/**
 * Eleccion de butacas y confirmacion de la reserva.
 *
 * Vive en la zona publica para que cualquiera pueda ver el mapa de la sala,
 * pero confirmar exige sesion: POST /reservas solo acepta rol CLIENTE. Los
 * asientos se vuelven a validar en el servidor al confirmar, asi que un
 * choque con otra persona se muestra como error y se recarga el mapa.
 */
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Funcion } from '@/types/cartelera';
import { Asiento, ReservaCreada } from '@/types/reserva';
import { fechaCorta, horaCorta, moneda } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { carteleraService } from '@/services/cartelera.service';
import { reservaService } from '@/services/reserva.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinners';
import { Container } from '@/components/common/container';

/** El backend no exige formato de codigo, solo que no vaya vacio */
function codigoReserva(idFuncion: number): string {
  const marca = Date.now().toString(36).toUpperCase();
  return `RES-${String(idFuncion).padStart(3, '0')}-${marca}`;
}

export function ReservaPage() {
  const { idFuncion } = useParams<{ idFuncion: string }>();
  const idFuncionNumero = Number(idFuncion);
  const { isAuthenticated, user } = useAuth();

  const [funcion, setFuncion] = useState<Funcion>();
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [reserva, setReserva] = useState<ReservaCreada | null>(null);

  // El backend exige rol CLIENTE; se avisa antes de gastar la peticion
  const esCliente = user?.roles.includes('CLIENTE') ?? false;

  useEffect(() => {
    // Un id que no es entero positivo no se consulta: el backend responde 400
    if (!Number.isInteger(idFuncionNumero) || idFuncionNumero < 1) {
      setCargando(false);
      return;
    }

    setCargando(true);
    Promise.all([
      // No hay endpoint de una sola funcion: se busca dentro del listado
      carteleraService.listarFunciones(),
      carteleraService.listarAsientos(idFuncionNumero),
    ])
      .then(([funciones, asientosHallados]) => {
        setFuncion(funciones.find((f) => f.idFuncion === idFuncionNumero));
        setAsientos(asientosHallados);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [idFuncionNumero]);

  // El backend devuelve los asientos en lista: se agrupan por fila
  const filas = useMemo(() => {
    const mapa = new Map<string, Asiento[]>();

    for (const asiento of asientos) {
      const enLaFila = mapa.get(asiento.fila) ?? [];
      enLaFila.push(asiento);
      mapa.set(asiento.fila, enLaFila);
    }

    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fila, butacas]) => ({
        fila,
        asientos: butacas.sort((x, y) => x.numero - y.numero),
      }));
  }, [asientos]);

  // idAsiento -> "A1", para poder nombrar las butacas elegidas
  const etiquetaAsiento = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const asiento of asientos) {
      mapa.set(asiento.idAsiento, asiento.asiento);
    }
    return mapa;
  }, [asientos]);

  const total = (funcion?.precio ?? 0) * elegidos.length;

  const etiquetasElegidas = elegidos
    .map((id) => etiquetaAsiento.get(id) ?? id)
    .sort()
    .join(', ');

  function alternar(asiento: Asiento) {
    if (asiento.disponible === false) return;

    setElegidos((prev) =>
      prev.includes(asiento.idAsiento)
        ? prev.filter((id) => id !== asiento.idAsiento)
        : [...prev, asiento.idAsiento],
    );
  }

  async function confirmar() {
    if (!funcion || !user?.id || elegidos.length === 0) return;

    setEnviando(true);
    setError(null);

    try {
      const creada = await reservaService.crear({
        idCliente: user.id,
        idFuncion: funcion.idFuncion,
        fechaReserva: new Date().toISOString(),
        codigoReserva: codigoReserva(funcion.idFuncion),
        estado: 'PENDIENTE',
        total,
        detalles: elegidos.map((idAsiento) => ({
          idAsiento,
          precio: funcion.precio,
        })),
      });

      setReserva(creada);
      setElegidos([]);

      // El mapa mostrado ya no refleja la reserva: se recarga para que las
      // butacas recien tomadas aparezcan ocupadas
      try {
        setAsientos(await carteleraService.listarAsientos(idFuncionNumero));
      } catch {
        // Si no se puede recargar, el comprobante de arriba sigue siendo valido
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo registrar la reserva.',
      );

      // Si el choque fue por butacas ocupadas el mapa quedo viejo: se recarga
      try {
        setAsientos(await carteleraService.listarAsientos(idFuncionNumero));
      } catch {
        // Si tampoco se puede recargar, queda el mensaje anterior
      }
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <Container>
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4 animate-spin" /> Cargando butacas...
        </div>
      </Container>
    );
  }

  if (!funcion) {
    return (
      <Container>
        <div className="space-y-2 py-8">
          <p>No se encontro esa funcion</p>
          <Link
            to="/cartelera"
            className="text-sm text-primary hover:underline"
          >
            Volver a la cartelera
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 py-8">
        <Button variant="ghost" size="sm" asChild className="-ms-2">
          <Link to={`/peliculas/${funcion.idPelicula}`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a la pelicula
          </Link>
        </Button>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {funcion.pelicula}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {funcion.sala} · {funcion.tipoSala} · {fechaCorta(funcion.fecha)}{' '}
              · {horaCorta(funcion.horaInicio)} - {horaCorta(funcion.horaFin)}
            </p>
          </div>
          <Badge variant="secondary">{moneda(funcion.precio)} por butaca</Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle className="h-4 w-4" />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {reserva && (
          <section className="space-y-3 rounded-xl border border-primary/40 bg-card p-6">
            <h2 className="text-lg font-semibold">Reserva registrada</h2>
            <p className="text-sm text-muted-foreground">
              Codigo{' '}
              <span className="font-medium text-foreground">
                {reserva.reserva.codigo}
              </span>{' '}
              · Estado {reserva.reserva.estado} · Total{' '}
              {moneda(reserva.reserva.total)}
            </p>
            <p className="text-sm">
              Butacas:{' '}
              {reserva.detalles
                .map(
                  (detalle) =>
                    etiquetaAsiento.get(detalle.idAsiento) ?? detalle.idAsiento,
                )
                .join(', ')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild>
                <Link to="/cartelera">Ver la cartelera</Link>
              </Button>
              <Button variant="outline" onClick={() => setReserva(null)}>
                Reservar otra funcion
              </Button>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-border" /> Libre
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary" /> Elegida
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-muted" /> Ocupada
              </span>
            </div>

            <div className="space-y-1.5 overflow-x-auto pb-2">
              <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
                Pantalla
              </p>
              <div className="mx-auto mb-3 h-1.5 w-2/3 rounded bg-muted-foreground/30" />

              {filas.map(({ fila, asientos: deLaFila }) => (
                <div
                  key={fila}
                  className="flex items-center justify-center gap-1.5"
                >
                  <span className="w-4 text-xs text-muted-foreground">
                    {fila}
                  </span>

                  {deLaFila.map((asiento) => {
                    const ocupado = asiento.disponible === false;
                    const elegido = elegidos.includes(asiento.idAsiento);

                    return (
                      <button
                        key={asiento.idAsiento}
                        type="button"
                        disabled={ocupado}
                        onClick={() => alternar(asiento)}
                        title={`${asiento.asiento} · ${asiento.tipo}${
                          ocupado ? ' · ocupada' : ''
                        }`}
                        className={cn(
                          'h-7 w-7 rounded border text-[10px] transition-colors',
                          ocupado &&
                            'cursor-not-allowed border-transparent bg-muted text-muted-foreground',
                          !ocupado &&
                            !elegido &&
                            'border-border hover:border-primary',
                          elegido &&
                            'border-primary bg-primary text-primary-foreground',
                        )}
                      >
                        {asiento.numero}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Tu reserva</h2>

            <p className="text-sm text-muted-foreground">
              {elegidos.length === 0
                ? 'Elige tus butacas en el mapa.'
                : `${elegidos.length} butaca(s) elegida(s)`}
            </p>

            {elegidos.length > 0 && (
              <p className="text-sm font-medium">{etiquetasElegidas}</p>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{moneda(total)}</span>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link
                    to={`/auth/signin?next=${encodeURIComponent(
                      `/reservar/${idFuncionNumero}`,
                    )}`}
                  >
                    Ingresar para reservar
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    to={`/auth/signup?next=${encodeURIComponent(
                      `/reservar/${idFuncionNumero}`,
                    )}`}
                  >
                    Crear una cuenta
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Necesitas una cuenta para confirmar la reserva.
                </p>
              </div>
            ) : !esCliente ? (
              <Alert>
                <AlertIcon>
                  <AlertCircle className="h-4 w-4" />
                </AlertIcon>
                <AlertTitle>
                  Solo las cuentas de cliente pueden reservar.
                </AlertTitle>
              </Alert>
            ) : (
              <Button
                className="w-full"
                onClick={confirmar}
                disabled={elegidos.length === 0 || enviando}
              >
                {enviando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
                {enviando ? 'Registrando…' : 'Confirmar reserva'}
              </Button>
            )}
          </aside>
        </div>
      </div>
    </Container>
  );
}
