import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as serviceWorkerRegistration from './lib/serviceWorkerRegistration'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support (disabled in development)
if (import.meta.env.PROD) {
  serviceWorkerRegistration.register({
    onSuccess: () => {
      console.log('Service worker registered successfully');
    },
    onUpdate: () => {
      console.log('New content available; please refresh.');
    },
    onOfflineReady: () => {
      console.log('App is ready for offline use');
    },
  });
} else {
  console.log('Service worker disabled in development mode');
  // Unregister any existing service workers in development
  serviceWorkerRegistration.unregister();
}
