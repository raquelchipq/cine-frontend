import { AuthRouting } from '@/auth/auth-routing';
import { useAuth } from '@/auth/context/auth-context';
import { RequireAuth } from '@/auth/require-auth';
import { RequireRole } from '@/auth/require-role';
import { ScreenLoader } from '@/components/common/screen-loader';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { PublicoLayout } from '@/layouts/publico/layout';
import { CarteleraPage } from '@/pages/cartelera/cartelera-page';
import { FuncionNuevaPage } from '@/pages/cartelera/funcion-nueva-page';
import { CineHomePage } from '@/pages/cine';
import { PeliculaNuevaPage } from '@/pages/panel/pelicula-nueva-page';
import { PeliculaEditarPage } from '@/pages/peliculas/pelicula-editar-page';
import { PeliculasDellatePage } from '@/pages/peliculas/peliculas-detalle-page';
import { PeliculasPage } from '@/pages/peliculas/peliculas-page';
import { GerenteNuevaPage } from '@/pages/personas/gerente-nueva-page';
import { PersonasPage } from '@/pages/personas/personas-page';
import { ReservaPage } from '@/pages/reservas/reserva-page';
import { MisReservasPage } from '@/pages/reservas/mis-reservas-page';
import { RolesPage } from '@/pages/roles/roles-page';
import { Navigate, Route, Routes } from 'react-router';

/**
 * Raiz de la aplicacion.
 *
 * Es la primera pantalla que ve cualquiera. Si no hay sesion se muestra la
 * cartelera publica (el visitante no debe toparse con un login); si ya entro,
 * se muestra su panel. Mientras se restaura la sesion no se decide todavia.
 */
function RaizPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  // Con sesion, el panel vive dentro de su propio layout: se redirige ahi
  return isAuthenticated ? <Navigate to="/inicio" replace /> : <CarteleraPage />;
}

/**
 * Las tres zonas de rutas.
 *
 * PUBLICA        sin sesion: cartelera, detalle y eleccion de butacas. El
 *                visitante anonimo puede recorrer todo el flujo y solo se le
 *                pide ingresar al confirmar la reserva.
 * PRIVADA        <RequireAuth>: solo pide haber entrado
 * ADMINISTRATIVA <RequireRole>: ademas pide rol, para no ofrecer pantallas que
 *                el backend va a rechazar con 403
 */
export function AppRoutingSetup() {
  return (
    <Routes>
      {/* PUBLICA: sin sesion se navega la cartelera completa */}
      <Route element={<PublicoLayout />}>
        {/*
          La raiz es publica y decide segun la sesion: el visitante anonimo ve
          la cartelera y el usuario con sesion ve su panel. Asi el primer
          contacto nunca pide login.
        */}
        <Route path="/" element={<RaizPage />} />
        <Route path="/cartelera" element={<CarteleraPage />} />
        <Route path="/peliculas" element={<PeliculasPage />} />
        {/* Ojo: /peliculas/nueva no vive aca sino en la zona administrativa.
            React Router prefiere el segmento fijo antes que :id, asi que el alta
            gana la carrera y este detalle nunca recibe el id "nueva". */}
        <Route path="/peliculas/:id" element={<PeliculasDellatePage />} />
        {/*
          Elegir butacas se deja en la zona publica a proposito: cualquiera
          puede ver el mapa de la sala y confirmar solo pide sesion.
        */}
        <Route path="/reservar/:idFuncion" element={<ReservaPage />} />
      </Route>

      {/* PRIVADA */}
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route path="/inicio" element={<CineHomePage />} />
          <Route path="/mis-reservas" element={<MisReservasPage />} />

          {/* ADMINISTRATIVA */}
          <Route element={<RequireRole roles={['ADMIN', 'GERENTE']} />}>
            {/* Alta de funciones: la cartelera en si es publica */}
            <Route path="/cartelera/nueva" element={<FuncionNuevaPage />} />
            {/* Ruta oficial del alta de peliculas */}
            <Route path="/peliculas/nueva" element={<PeliculaNuevaPage />} />
            {/* Editar pelicula y reemplazar su poster (PUT /peliculas/:id) */}
            <Route
              path="/peliculas/:id/editar"
              element={<PeliculaEditarPage />}
            />
            <Route path="/personas" element={<PersonasPage />} />
            {/* Alta de gerentes: POST /persona/gerente pide ADMIN o GERENTE */}
            <Route path="/personas/nueva" element={<GerenteNuevaPage />} />
            {/* Cambiar roles: POST /auth/rol-usuario es exclusivo del ADMIN */}
            <Route element={<RequireRole roles={['ADMIN']} />}>
              <Route path="/roles" element={<RolesPage />} />
            </Route>
            {/* La ruta vieja del panel se mantiene solo como redireccion */}
            <Route
              path="/panel/peliculas/nueva"
              element={<Navigate to="/peliculas/nueva" replace />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="error/*" element={<ErrorRouting />} />
      <Route path="auth/*" element={<AuthRouting />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
