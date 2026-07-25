import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/editor.css';

const container = document.getElementById('root');
if (!container) throw new Error('לא נמצא אלמנט השורש #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
