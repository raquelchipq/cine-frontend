import { MenuConfig, MenuItem } from '@/config/types';

/**
 * Filtra el menu lateral segun los roles de la sesion.
 *
 * No es seguridad: solo evita ofrecer pantallas que el backend va a rechazar
 * con 403. Las entradas sin `roles` las ve cualquiera que haya entrado.
 */
function permitida(item: MenuItem, roles: string[]): boolean {
  if (!item.roles) return true;
  return item.roles.some((rol) => roles.includes(rol));
}

export function menuPorRol(menu: MenuConfig, roles: string[]): MenuConfig {
  const visibles = menu
    .filter((item) => permitida(item, roles))
    .map((item) => ({
      ...item,
      children: item.children ? menuPorRol(item.children, roles) : undefined,
    }));

  // Un encabezado sin entradas debajo queda raro: se descarta
  return visibles.filter(
    (item, i) =>
      !item.heading || (!!visibles[i + 1] && !visibles[i + 1].heading),
  );
}
