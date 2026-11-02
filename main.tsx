import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker using vite-plugin-pwa official virtual registration
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      console.log('Razão XP ServiceWorker registado com sucesso');
    }
  },
  onRegisterError(error) {
    console.error('Erro no registo do ServiceWorker:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
