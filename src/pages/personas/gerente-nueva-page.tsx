/**
 * Alta de un gerente (solo ADMIN o GERENTE).
 *
 * Reutiliza el formulario del registro publico porque el backend recibe el
 * mismo cuerpo: la diferencia es el endpoint y que asigna el rol GERENTE.
 */
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { Container } from '@/components/common/container';
import {
  GerenteNuevaSchemaType,
  getGerenteNuevaSchema,
} from './gerente-nueva-schema';

export function GerenteNuevaPage() {
  const navigate = useNavigate();
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GerenteNuevaSchemaType>({
    resolver: zodResolver(getGerenteNuevaSchema()),
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

  async function onSubmit(values: GerenteNuevaSchemaType) {
    setEnviando(true);
    setError(null);

    try {
      const gerente = await personaService.registrarGerente(values);
      toast.success(`Gerente ${gerente.nombres} ${gerente.apellidos} creado`);
      navigate('/personas');
    } catch (err) {
      // El backend avisa si el usuario o el documento ya existen
      setError(
        err instanceof Error ? err.message : 'No se pudo crear el gerente.',
      );
      setEnviando(false);
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div className="space-y-1">
          <Link
            to="/personas"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al padron
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nuevo gerente
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea un usuario con rol GERENTE para que administre la cartelera, el
            catalogo y el padron.
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
                        placeholder="Maria Fernanda"
                        disabled={enviando}
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
                        placeholder="Lopez Rojas"
                        disabled={enviando}
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
                        placeholder="76543210"
                        disabled={enviando}
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
                        placeholder="70000000"
                        disabled={enviando}
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
                      placeholder="gerente@cine.com"
                      disabled={enviando}
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
                    <Input type="date" disabled={enviando} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="maria.gerente"
                        autoComplete="off"
                        disabled={enviando}
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
                    <FormLabel>Contrasena</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={verContrasena ? 'text' : 'password'}
                          placeholder="Minimo 6 caracteres"
                          autoComplete="new-password"
                          disabled={enviando}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setVerContrasena((v) => !v)}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={
                            verContrasena
                              ? 'Ocultar contrasena'
                              : 'Mostrar contrasena'
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
            </div>

            <Button type="submit" disabled={enviando} className="w-full">
              {enviando && <Spinner className="h-4 w-4 animate-spin" />}
              {enviando ? 'Guardando...' : 'Crear gerente'}
            </Button>
          </form>
        </Form>
      </div>
    </Container>
  );
}
