import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { setupWebAPI } from './lib/api'

setupWebAPI()

// Silencing the persistent "AbortError: The play() request was interrupted" console spam
const originalError = console.error;
console.error = (...args: any[]) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('AbortError')) return;
  if (args[0] && args[0] instanceof Error && args[0].name === 'AbortError') return;
  originalError.apply(console, args);
};

// Also handle unhandled promise rejections for the same error
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || (event.reason?.message && event.reason.message.includes('play()'))) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
