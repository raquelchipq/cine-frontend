/**
 * Lee y escribe en el localStorage del navegador.
 *
 * Los catch quedan mudos a proposito: si el navegador bloquea el
 * almacenamiento la pantalla sigue funcionando, solo pierde el dato.
 */

const getData = (key: string): unknown | undefined => {
  try {
    const data = localStorage.getItem(key);

    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Lectura fallida (JSON invalido o almacenamiento bloqueado): no hay dato
  }
};

const setData = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Escritura fallida (almacenamiento lleno o bloqueado): se ignora
  }
};

export { getData, setData };
