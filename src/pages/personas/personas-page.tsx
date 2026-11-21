/**
 * Padron de personas del cine (solo ADMIN o GERENTE).
 *
 * GET /persona es paginado y GET /persona/buscar filtra por nombres o
 * apellidos; la pantalla usa uno u otro segun haya busqueda escrita.
 */
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { AlertCircle, Search, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonaListada } from '@/types/persona';
import { fechaCorta } from '@/lib/formato';
import { personaService } from '@/services/persona.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinners';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Container } from '@/components/common/container';

const POR_PAGINA = 10;
/** Los mismos roles que exige el backend para crear gerentes. */
const ROLES_ALTA = ['ADMIN', 'GERENTE'];

export function PersonasPage() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<PersonaListada[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  // Lo escrito y lo consultado no son lo mismo: recien al apretar Buscar se
  // dispara la peticion
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [busqueda, setBusqueda] = useState({ nombres: '', apellidos: '' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // La ruta ya pide el rol; se comprueba igual para no ofrecer un alta que el
  // backend va a rechazar con 403
  const puedeCrear =
    user?.roles.some((rol) => ROLES_ALTA.includes(rol)) ?? false;

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    const hayBusqueda =
      busqueda.nombres.trim() !== '' || busqueda.apellidos.trim() !== '';
    const peticion = hayBusqueda
      ? personaService.buscar(
          busqueda.nombres,
          busqueda.apellidos,
          pagina,
          POR_PAGINA,
        )
      : personaService.listar(pagina, POR_PAGINA);

    peticion
      .then((respuesta) => {
        if (!vigente) return;
        setPersonas(respuesta.data);
        setTotal(respuesta.total);
        setError(null);
      })
      .catch((err) => {
        if (vigente) {
          setError(
            err instanceof Error ? err.message : 'No se pudo cargar el padron',
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [pagina, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hayBusqueda =
    busqueda.nombres.trim() !== '' || busqueda.apellidos.trim() !== '';

  const buscar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setPagina(1);
    setBusqueda({ nombres, apellidos });
  };

  const limpiar = () => {
    setNombres('');
    setApellidos('');
    setPagina(1);
    setBusqueda({ nombres: '', apellidos: '' });
  };

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Personas</h1>
            <p className="text-sm text-muted-foreground">
              Padron de personas registradas y como contactarlas.
            </p>
          </div>

          {/* El alta de gerentes vive aca dentro: mismo criterio que Peliculas */}
          {puedeCrear && (
            <Button asChild>
              <Link to="/personas/nueva">
                <UserPlus />
                Nuevo gerente
              </Link>
            </Button>
          )}
        </div>

        <form
          onSubmit={buscar}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="space-y-1">
            <label htmlFor="nombres" className="text-sm font-medium">
              Nombres
            </label>
            <Input
              id="nombres"
              value={nombres}
              placeholder="Buscar por nombres"
              onChange={(evento) => setNombres(evento.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="apellidos" className="text-sm font-medium">
              Apellidos
            </label>
            <Input
              id="apellidos"
              value={apellidos}
              placeholder="Buscar por apellidos"
              onChange={(evento) => setApellidos(evento.target.value)}
            />
          </div>
          <Button type="submit">
            <Search />
            Buscar
          </Button>
          {hayBusqueda && (
            <Button type="button" variant="ghost" onClick={limpiar}>
              Limpiar
            </Button>
          )}
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle className="h-4 w-4" />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombres</TableHead>
                <TableHead>Apellidos</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nacimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner className="h-4 w-4 animate-spin" />
                      Cargando personas...
                    </span>
                  </TableCell>
                </TableRow>
              ) : personas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No hay personas que coincidan con la busqueda.
                  </TableCell>
                </TableRow>
              ) : (
                personas.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell className="font-medium">
                      {persona.nombres}
                    </TableCell>
                    <TableCell>{persona.apellidos}</TableCell>
                    <TableCell>{persona.documento}</TableCell>
                    <TableCell>{persona.telefono}</TableCell>
                    <TableCell>{persona.email}</TableCell>
                    <TableCell>{fechaCorta(persona.fechaNacimiento)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'persona' : 'personas'} - pagina {pagina} de{' '}
            {totalPaginas}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={cargando || pagina <= 1}
              onClick={() => setPagina((actual) => actual - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={cargando || pagina >= totalPaginas}
              onClick={() => setPagina((actual) => actual + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
