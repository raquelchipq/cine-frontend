/**
 * Formulario de ingreso.
 *
 * Llama a `login` del proveedor de sesion (que devuelve la sesion) y manda al
 * usuario a `next` o, si no venia de ninguna ruta, al destino de su rol.
 */
import { useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { destinoPorRol } from '@/auth/destino-por-rol';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Spinner } from '@/components/ui/spinners';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [verContrasena, setVerContrasena] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A donde volver despues de entrar (lo pone RequireAuth)
  const next = searchParams.get('next');

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    // Credenciales de prueba del entorno local. Estan a la vista a proposito:
    // son las que crearon los endpoints del diplomado.
    defaultValues: {
      usuario: 'FAVIO1234567',
      contrasena: 'admin123',
      recordarme: true,
    },
  });

  async function onSubmit(values: SigninSchemaType) {
    try {
      setProcesando(true);
      setError(null);

      const sesion = await login(values.usuario, values.contrasena);

      // El `next` manda; si no hay, cada rol tiene su destino
      navigate(next || destinoPorRol(sesion.roles));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Cine</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa con tu usuario para continuar
        </p>
        <p className="text-xs text-muted-foreground">
          Acceso de prueba: <span className="font-medium">FAVIO1234567</span> /{' '}
          <span className="font-medium">admin123</span> (rol ADMIN)
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="usuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input
                    placeholder="tu.usuario"
                    autoComplete="username"
                    disabled={procesando}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contrasena"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={verContrasena ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={procesando}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        verContrasena
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {verContrasena ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={procesando}>
            {procesando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
            {procesando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          to={`/auth/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-medium text-primary hover:underline"
        >
          Registrate
        </Link>
      </p>
    </div>
  );
}
