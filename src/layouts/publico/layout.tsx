/**
 * Cabecera y pie de la zona publica (sin sesion).
 *
 * Los enlaces apuntan a la lista de peliculas, que es la puerta de entrada: el
 * detalle, sus funciones y las butacas cuelgan de ahi. Si ya hay sesion, el
 * boton lleva a la cartelera en vez de ofrecer "Ingresar" otra vez.
 */
import { useAuth } from '@/auth/context/auth-context';
import { Helmet } from 'react-helmet-async';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';

const ENLACES = [
  { titulo: 'Peliculas', ruta: '/peliculas' },
  { titulo: 'Cartelera', ruta: '/cartelera' },
];

export function PublicoLayout() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Cine</title>
      </Helmet>
      {/* sticky: la cabecera se queda arriba al hacer scroll */}
      <header className="sticky top-0 z-10 border-b border-border bg-background">
        <Container className="flex h-16 items-center justify-between gap-6">
          {/* Nombre: siempre lleva al inicio de la zona publica */}
          <Link
            to="/peliculas"
            className="text-lg font-semibold tracking-tight text-mono"
          >
            CINE
          </Link>

          <nav className="flex flex-1 items-center gap-6">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.ruta}
                to={enlace.ruta}
                className={({ isActive }) =>
                  isActive
                    ? 'text-sm font-medium text-primary'
                    : 'text-sm font-medium text-secondary-foreground hover:text-primary'
                }
              >
                {enlace.titulo}
              </NavLink>
            ))}
          </nav>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user?.usuario}
              </span>
              {/* Con sesion abierta, el acceso natural es el panel, que cambia
                  segun el rol; la cartelera ya esta en el menu de arriba */}
              <Button variant="outline" size="sm" asChild>
                <Link to="/inicio">Ir al panel</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/signin">Ingresar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/signup">Crear cuenta</Link>
              </Button>
            </div>
          )}
        </Container>
      </header>
      {/* Outlet: aqui React Router inserta la pantalla de la ruta actual */}
      <main className="grow">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6">
        <Container>
          <p className="text-center text-sm text-muted-foreground">Cine</p>
        </Container>
      </footer>
    </>
  );
}
