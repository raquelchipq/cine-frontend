import axios from 'axios';
import { env } from '@/config/env';
import { borrarToken, leerToken } from '@/lib/token';

/**
 * Cliente axios. Es el unico archivo del proyecto que usa axios.
 *
 * request   adjunta el Bearer a TODAS las peticiones; las publicas lo ignoran,
 *           asi no hay una lista de rutas que mantener
 * response  extrae el message del backend y, si llega 401 fuera del login,
 *           borra el token porque la sesion ya no sirve
 */
export const http = axios.create({
  // axios arma http://localhost:3000/api/v1/peliculas
  baseURL: env.apiUrl,
  timeout: 10000, // 10 seg
});

http.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // OJO: aqui NO se toca Content-Type. Con un FormData axios pone
  // multipart/form-data solo, con su limite de partes; forzarlo a mano rompe
  // la subida de archivos.
  return config;
});

http.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    // El backend responde {status, message, timestamp}
    let mensaje =
      error.response?.data?.message ?? 'No se puede conectar con el servidor';
    // Con errores de validacion de NestJS el message viene como arreglo
    if (Array.isArray(mensaje)) mensaje = mensaje.join(' / ');

    // Sesion vencida: se borra para que el login la vuelva a pedir
    const esLogin = String(error.config?.url ?? '').includes('/auth/login');
    if (error.response?.status === 401 && !esLogin) {
      borrarToken();
    }

    return Promise.reject(new Error(mensaje));
  },
);
