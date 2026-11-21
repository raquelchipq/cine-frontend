import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Reserva } from '@/types/reserva';
import { fechaCorta, horaCorta, moneda } from '@/lib/formato';
import { reservaService } from '@/services/reserva.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinners';
import { Container } from '@/components/common/container';

export function MisReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    reservaService
      .listarMisReservas()
      .then((datos) => {
        if (!vigente) return;
        setReservas(datos);
      })
      .catch((err) => {
        if (vigente) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas');
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const getEstadoVariant = (estado: string) => {
    const e = estado?.toUpperCase();
    if (e === 'CANCELADA') return 'destructive';
    if (e === 'CONFIRMADA' || e === 'PAGADA' || e === 'APROBADA') return 'primary';
    return 'secondary';
  };

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Mis reservas</h1>
          <p className="text-sm text-muted-foreground">
            Aquí ves todas las funciones que tienes reservadas.
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
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4 animate-spin" />
            Cargando tus reservas...
          </div>
        ) : reservas.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Aún no tienes reservas realizadas.
          </p>
        ) : (
          <div className="space-y-3">
            {reservas.map((reserva) => (
              <article
                key={reserva.idReserva}
                className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-medium sm:text-lg">
                      {reserva.pelicula}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {reserva.sala} • {reserva.tipoSala}
                    </p>
                  </div>
                  <Badge variant={getEstadoVariant(reserva.estado)} className="shrink-0 uppercase">
                    {reserva.estado}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">{fechaCorta(reserva.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horario</p>
                    <p className="font-medium">
                      {horaCorta(reserva.horaInicio)} – {horaCorta(reserva.horaFin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asientos</p>
                    <p className="font-medium">
                      {Array.isArray(reserva.asientos) && reserva.asientos.length > 0
                        ? reserva.asientos.map((a: any) => a.asiento).join(', ')
                        : reserva.cantidadAsientos}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium text-primary">
                      {moneda(reserva.total)}
                    </p>
                  </div>
                </div>

                {reserva.codigoReserva && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Código de reserva: <span className="font-mono">{reserva.codigoReserva}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
