/**
 * Raiz de la aplicacion: los proveedores y el router.
 *
 * `CineAuthProvider` va arriba de todo porque el resto (menu, rutas) necesita
 * saber si hay sesion y con que roles.
 */
import { CineAuthProvider } from '@/auth/providers/cine-auth-provider';
import { AppRouting } from '@/routing/app-routing';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from './providers/i18n-provider';
import { QueryProvider } from './providers/query-provider';
import { SettingsProvider } from './providers/settings-provider';
import { ThemeProvider } from './providers/theme-provider';
import { TooltipsProvider } from './providers/tooltips-provider';

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <QueryProvider>
      <CineAuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <I18nProvider>
              <HelmetProvider>
                <TooltipsProvider>
                  <LoadingBarContainer>
                    <BrowserRouter basename={BASE_URL}>
                      <Toaster />

                      <AppRouting />
                    </BrowserRouter>
                  </LoadingBarContainer>
                </TooltipsProvider>
              </HelmetProvider>
            </I18nProvider>
          </ThemeProvider>
        </SettingsProvider>
      </CineAuthProvider>
    </QueryProvider>
  );
}
