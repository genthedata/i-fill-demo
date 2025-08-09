import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force the correct API base on load (no manual save needed)
const DESIRED_BASE = "https://ed19d692f9dd.ngrok-free.app";
try {
  (window as any).BASE_URL = DESIRED_BASE;
  localStorage.setItem('API_BASE_URL', DESIRED_BASE);
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
