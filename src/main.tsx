/**
 * Punto de entrada: monta App una sola vez.
 *
 * Aqui vivia una peticion de prueba a la cartelera que se disparaba en cada
 * arranque; se quito al cerrar ese paso.
 */
import './css/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
