import { RouteObject } from 'react-router-dom';
import { BrandedLayout } from './layouts/branded';
import { SignInPage } from './pages/signin-page';
import { SignUpPage } from './pages/signup-page';

/**
 * Rutas publicas de acceso, montadas en /auth/*.
 *
 * Ingreso y registro: POST /persona (el alta) es publico, asi que la pantalla
 * de registro no necesita sesion. Falta la recuperacion de contrasena.
 */
export const authRoutes: RouteObject[] = [
  {
    path: '',
    element: <BrandedLayout />,
    children: [
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
    ],
  },
];
