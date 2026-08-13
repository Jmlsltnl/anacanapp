import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, removeOldestQuery } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLockGate from "@/components/security/AppLockGate";
import Index from "./pages/Index";
import ResetPassword from "./pages/ResetPassword";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./components/payment/PaymentSuccess";
import PaymentError from "./components/payment/PaymentError";
import RevenueCatDebug from "./pages/RevenueCatDebug";
import PartnerVerifyPage from "./pages/PartnerVerifyPage";
import MiniGamesPage from "./pages/MiniGamesPage";
import { initRevenueCat } from "@/lib/revenuecat";
import { loadTranslations } from "@/lib/i18n";
import { useUserStore } from "@/store/userStore";

// Offline-first: sorğu cache-i localStorage-da saxlanılır ki, şəbəkəsiz açılışda
// son vəziyyət (dashboard datası, kontent, partner məlumatı və s.) dərhal görünsün.
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 gün

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Persist bərpası üçün gcTime ≥ maxAge olmalıdır, əks halda cache atılır
      gcTime: CACHE_MAX_AGE
    }
  }
});

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'anacan-rq-cache',
  throttleTime: 2000,
  // localStorage dolarsa ən köhnə sorğunu silib yenidən cəhd et
  retry: removeOldestQuery
});

const persistOptions = {
  persister,
  maxAge: CACHE_MAX_AGE,
  buster: 'anacan-rq-v1', // cache sxemi dəyişəndə artırın
  dehydrateOptions: {
    // Yalnız uğurlu sorğular persist olunur; admin dataları saxlanmır
    shouldDehydrateQuery: (query: any) =>
    query.state.status === 'success' &&
    !JSON.stringify(query.queryKey).toLowerCase().includes('admin')
  }
};

// Initialize RevenueCat on app startup
initRevenueCat().catch(console.error);

// Preload translations for current language (after Zustand rehydrate)
setTimeout(() => {
  const lang = useUserStore.getState().language;
  // getLocaleTag() üçün sync — mövcud istifadəçilərdə localStorage boş qala bilərdi
  try { localStorage.setItem('language', lang || 'az'); } catch { /* boş */ }
  if (lang && lang !== 'az') loadTranslations(lang).catch(console.error);
}, 0);

const App = () => {
  // Subscribe to language so the whole tree re-renders when the user switches
  // language. tr() reads language synchronously from the store, but without a
  // subscription nothing would re-render and translations would appear "stuck".
  const language = useUserStore((s) => s.language);

  useEffect(() => {
    if (language) {
      document.documentElement.setAttribute('lang', language);
      if (language !== 'az') {
        loadTranslations(language).catch(console.error);
      }
    }
  }, [language]);

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {/* Təhlükəsizlik kilidi — bütün ekranların üstündə (z-400) */}
              <AppLockGate />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/legal/:docType" element={<LegalPage />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/error" element={<PaymentError />} />
                  <Route path="/debug/revenuecat" element={<RevenueCatDebug />} />
                  <Route path="/revenuecat-debug" element={<RevenueCatDebug />} />
                  <Route path="/p/v/:token" element={<PartnerVerifyPage />} />
                  <Route path="/mini-games" element={<MiniGamesPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
