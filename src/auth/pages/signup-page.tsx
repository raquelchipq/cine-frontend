/**
 * Formulario de registro de un cliente nuevo.
 *
 * Llama a POST /persona (publico) y, si sale bien, inicia sesion con las
 * mismas credenciales: asi la persona no tiene que escribir todo otra vez y
 * vuelve derecho a donde iba (por ejemplo, a elegir butacas).
 */
import { useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { destinoPorRol } from '@/auth/destino-por-rol';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { personaService } from '@/services/persona.service';
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
import { getSignupSchema, SignupSchemaType } from '../forms/signup-schema';

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [verContrasena, setVerContrasena] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get('next');

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    defaultValues: {
      nombres: '',
      apellidos: '',
      documento: '',
      telefono: '',
      email: '',
      fechaNacimiento: '',
      usuario: '',
      constrasena: '',
    },
  });

  async function onSubmit(values: SignupSchemaType) {
    setProcesando(true);
    setError(null);

    try {
      await personaService.registrar(values);
    } catch (err) {
      // El backend avisa si el usuario o el documento ya existen
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la cuenta.',
      );
      setProcesando(false);
      return;
    }

    // La cuenta ya existe: se entra con las mismas credenciales
    try {
      const sesion = await login(values.usuario, values.constrasena);
      navigate(next || destinoPorRol(sesion.roles));
    } catch {
      // Si el ingreso automatico falla, al menos queda el aviso de entrar
      navigate(
        `/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`,
      );
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Registrate para elegir tus butacas
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ana Maria"
                      autoComplete="given-name"
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
              name="apellidos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Perez Lopez"
                      autoComplete="family-name"
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
              name="documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="12345678"
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
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="70123456"
                      autoComplete="tel"
                      disabled={procesando}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ana@example.com"
                    autoComplete="email"
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
            name="fechaNacimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" disabled={procesando} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ana.perez"
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
            name="constrasena"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={verContrasena ? 'text' : 'password'}
                      placeholder="Minimo 6 caracteres"
                      autoComplete="new-password"
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
            {procesando ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link
          to={`/auth/signin${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-medium text-primary hover:underline"
        >
          Ingresar
        </Link>
      </p>
    </div>
  );
}
