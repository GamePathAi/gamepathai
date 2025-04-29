
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "./lib/i18n";
import App from "./App.tsx";
import "./index.css";

// Importar a fonte Inter
import "@fontsource/inter/400.css";  // Fonte regular
import "@fontsource/inter/600.css";  // Fonte semi-bold
import "@fontsource/inter/700.css";  // Fonte bold

// Import i18n configuration before rendering the app
import "./lib/i18n.ts";
import { CheckoutProvider } from "./contexts/CheckoutContext";
import { AuthProvider } from "./contexts/AuthContext";
import { initializeApp } from "./utils/appInitializer";
import { periodicCleanup } from "./utils/cspHelper";

// Initialize application configurations - ENHANCED PROTECTION
initializeApp();

// Periodic cleanup to remove any dynamically injected scripts
setInterval(periodicCleanup, 5000);

// Create a console message to warn about redirect issues
console.log('%c⚠️ ANTI-REDIRECT PROTECTION ACTIVE', 'color: red; font-size: 16px; font-weight: bold;');
console.log('%cIf experiencing issues, try disabling browser extensions', 'color: orange; font-size: 14px;');

// Criar cliente de consulta para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      refetchOnWindowFocus: false
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CheckoutProvider>
            <App />
          </CheckoutProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </BrowserRouter>
);

// Add a final protection measure
window.addEventListener('error', (event) => {
  if (event.message && 
     (event.message.includes('redirect') || 
      event.message.includes('gamepathai.com'))) {
    console.error('🚨 Detected error related to redirects:', event.message);
  }
});
