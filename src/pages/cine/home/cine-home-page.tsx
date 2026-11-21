/**
 * Inicio del panel.
 *
 * Es la puerta de entrada despues del login y muestra solo lo que el rol puede
 * hacer: mismas reglas que el menu lateral, para no prometer pantallas que el
 * backend va a rechazar con 403.
 */
import { useAuth } from '@/auth/context/auth-context';
import {
  CalendarDays,
  Clapperboard,
  LayoutDashboard,
  Ticket,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/common/container';

interface Acceso {
  titulo: string;
  detalle: string;
  ruta: string;
  icono: LucideIcon;
  /** Roles que lo ven. Sin lista, lo ve cualquiera que haya entrado. */
  roles?: string[];
}

const ACCESOS: Acceso[] = [
  {
    titulo: 'Reservar',
    detalle: 'Elige funcion y butacas y confirma tu entrada.',
    ruta: '/cartelera',
    icono: Ticket,
    roles: ['CLIENTE'],
  },
  {
    titulo: 'Cartelera',
    detalle: 'Funciones publicadas, con sala, horario y precio.',
    ruta: '/cartelera',
    icono: CalendarDays,
  },
  {
    titulo: 'Peliculas',
    detalle: 'Catalogo con las fichas de cada pelicula.',
    ruta: '/peliculas',
    icono: Clapperboard,
  },
  {
    titulo: 'Personas',
    detalle: 'Padron registrado, con busqueda y alta de gerentes.',
    ruta: '/personas',
    icono: Users,
    roles: ['ADMIN', 'GERENTE'],
  },
  {
    titulo: 'Roles',
    detalle: 'Define si un usuario administra, atiende o solo reserva.',
    ruta: '/roles',
    icono: UserCog,
    roles: ['ADMIN'],
  },
];

export function CineHomePage() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const administra = roles.some((rol) => rol === 'ADMIN' || rol === 'GERENTE');

  const visibles = ACCESOS.filter(
    (acceso) =>
      !acceso.roles || acceso.roles.some((rol) => roles.includes(rol)),
  );

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <LayoutDashboard className="size-6" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Hola, {user?.usuario}
            </h1>
            <p className="text-sm text-muted-foreground">
              {administra
                ? 'Desde aca se administra la cartelera, el catalogo y el padron.'
                : 'Estas dentro: mira la cartelera y reserva tus butacas.'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((acceso) => (
            <Link key={acceso.ruta} to={acceso.ruta} className="group">
              <Card className="h-full gap-3 transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                <CardHeader>
                  <span className="mb-1 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <acceso.icono className="size-5" />
                  </span>
                  <CardTitle>{acceso.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {acceso.detalle}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}
