import {
  BookmarkCheck,
  CalendarDays,
  Clapperboard,
  Home,
  Ticket,
  UserCog,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

/**
 * Menú de la aplicación de cine.
 *
 * Agrupado por uso: general, operación del cine y gestión del sistema.
 * `roles` marca quien ve cada entrada; lo aplica `menu-por-rol.ts`.
 */
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Inicio',
    icon: Home,
    path: '/inicio',
  },
  { heading: 'Cartelera y cine' },
  {
    title: 'Cartelera',
    icon: CalendarDays,
    path: '/cartelera',
  },
  {
    title: 'Películas',
    icon: Clapperboard,
    path: '/peliculas',
  },
  { heading: 'Mi cuenta' },
  {
    title: 'Reservar butacas',
    icon: Ticket,
    // Reservar arranca eligiendo funcion en la cartelera. El backend solo
    // acepta POST /reservas con rol CLIENTE.
    path: '/cartelera',
    roles: ['CLIENTE'],
  },
  {
    title: 'Mis reservas',
    icon: BookmarkCheck,
    path: '/mis-reservas',
    roles: ['CLIENTE'],
  },
  { heading: 'Gestión del cine' },
  {
    title: 'Personas',
    icon: Users,
    path: '/personas',
    roles: ['ADMIN', 'GERENTE'],
  },
  { heading: 'Sistema' },
  {
    title: 'Roles y permisos',
    icon: UserCog,
    // Solo ADMIN: POST /auth/rol-usuario es exclusivo del ADMIN
    path: '/roles',
    roles: ['ADMIN'],
  },
];

/** El menú superior reutiliza las mismas entradas: no hay mega menú que mantener. */
export const MENU_MEGA: MenuConfig = [
  { title: 'Inicio', path: '/inicio' },
  { title: 'Cartelera', path: '/cartelera' },
  { title: 'Películas', path: '/peliculas' },
];

export const MENU_MEGA_MOBILE: MenuConfig = MENU_MEGA;
