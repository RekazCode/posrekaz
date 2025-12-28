/**
 * Service Worker Registration
 * Phase F8: Offline & Sync
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
};

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      if (isLocalhost) {
        // In development, check if service worker exists
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This app is being served cache-first by a service worker in development mode.'
          );
        });
      } else {
        // Production - register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

async function registerValidSW(swUrl: string, config?: Config): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);

    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content is available; please refresh
            console.log('New content is available; will update on next refresh.');
            config?.onUpdate?.(registration);
          } else {
            // Content is cached for offline use
            console.log('Content is cached for offline use.');
            config?.onSuccess?.(registration);
            config?.onOfflineReady?.();
          }
        }
      };
    };
  } catch (error) {
    console.error('Error during service worker registration:', error);
  }
}

async function checkValidServiceWorker(swUrl: string, config?: Config): Promise<void> {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    });

    const contentType = response.headers.get('content-type');
    if (
      response.status === 404 ||
      (contentType && !contentType.includes('javascript'))
    ) {
      // No service worker found - unregister
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
    } else {
      // Service worker found - register
      registerValidSW(swUrl, config);
    }
  } catch {
    console.log('No internet connection found. App is running in offline mode.');
    config?.onOfflineReady?.();
  }
}

export async function unregister(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
    } catch (error) {
      console.error('Error unregistering service worker:', error);
    }
  }
}

// Check if service worker is supported and ready
export async function isServiceWorkerReady(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration;
  } catch {
    return false;
  }
}

// Send message to service worker
export async function sendMessageToSW(message: unknown): Promise<unknown> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  await navigator.serviceWorker.ready;
  const controller = navigator.serviceWorker.controller;

  if (!controller) {
    throw new Error('No active Service Worker');
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    controller.postMessage(message, [messageChannel.port2]);

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Service Worker message timeout'));
    }, 10000);
  });
}

// Request background sync
export async function requestBackgroundSync(tag: string = 'sync-sales'): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Background sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
      console.log('Background sync registered:', tag);
    }
  } catch (error) {
    console.warn('Background sync registration failed:', error);
  }
}
