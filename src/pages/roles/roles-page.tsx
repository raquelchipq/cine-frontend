/**
 * Asignacion de roles a los usuarios del cine (solo ADMIN).
 *
 * La pantalla arma lo que el backend pide: POST /auth/rol-usuario recibe el id
 * de una persona que ya tenga usuario y el id del rol. El rol elegido viaja en
 * el token, por eso se aclara que la persona tiene que entrar otra vez.
 *
 * El GERENTE no llega aca: no puede asignar roles, y RequireRole lo redirige.
 */
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, UserCog } from 'lucide-react';
import { Rol } from '@/types/auth';
import { PersonaListada } from '@/types/persona';
import { authService } from '@/services/auth.service';
import { personaService } from '@/services/persona.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export function RolesPage() {
  const [personas, setPersonas] = useState<PersonaListada[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Rol elegido en cada fila: idPersona -> idRol
  const [elegidos, setElegidos] = useState<Record<number, number>>({});
  const [asignando, setAsignando] = useState<number | null>(null);

  // Los roles se piden una sola vez: no cambian mientras se usa la pantalla
  useEffect(() => {
    let vigente = true;

    authService
      .listarRoles()
      .then((datos) => {
        if (vigente) setRoles(datos);
      })
      .catch((err) => {
        if (vigente) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron cargar los roles',
          );
        }
      });

    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    personaService
      .listar(pagina, POR_PAGINA)
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
  }, [pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  // El botón espera un rol elegido en la fila y que no haya otra asignación
  // en vuelo; el backend valida ademas que la persona tenga usuario
  const puedeAsignar = (persona: PersonaListada) =>
    !!elegidos[persona.id] && asignando === null;

  async function asignar(persona: PersonaListada) {
    const idRol = elegidos[persona.id];
    if (!idRol) return;

    setAsignando(persona.id);
    setError(null);
    setAviso(null);

    try {
      const rol = roles.find((opcion) => opcion.id === idRol);
      await authService.asignarRol(persona.id, idRol);

      setAviso(
        `Rol ${rol?.rol ?? ''} asignado a ${persona.nombres} ${persona.apellidos}. ` +
          'Esa persona debe cerrar y abrir sesion de nuevo para que su token traiga el cambio.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo asignar el rol.',
      );
    } finally {
      setAsignando(null);
    }
  }

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Asigna que puede hacer cada usuario: ADMIN gestiona todo, GERENTE
            administra la cartelera y CLIENTE solo reserva.
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

        {aviso && (
          <Alert>
            <AlertIcon>
              <CheckCircle2 className="h-4 w-4" />
            </AlertIcon>
            <AlertTitle>{aviso}</AlertTitle>
          </Alert>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="w-[150px]">Rol</TableHead>
                <TableHead className="w-[110px]" aria-label="Accion" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner className="h-4 w-4 animate-spin" />
                      Cargando personas...
                    </span>
                  </TableCell>
                </TableRow>
              ) : personas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Todavia no hay personas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                personas.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell className="font-medium">
                      {persona.nombres} {persona.apellidos}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {persona.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {persona.documento}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={
                          elegidos[persona.id]
                            ? String(elegidos[persona.id])
                            : undefined
                        }
                        onValueChange={(valor) =>
                          setElegidos((prev) => ({
                            ...prev,
                            [persona.id]: Number(valor),
                          }))
                        }
                        disabled={asignando !== null}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Elegir rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((rol) => (
                            <SelectItem key={rol.id} value={String(rol.id)}>
                              {rol.rol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!puedeAsignar(persona)}
                        onClick={() => void asignar(persona)}
                      >
                        {asignando === persona.id ? (
                          <Spinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCog />
                        )}
                        Asignar
                      </Button>
                    </TableCell>
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
