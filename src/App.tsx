import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import ResetPassword from "./pages/ResetPassword";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./components/payment/PaymentSuccess";
import PaymentError from "./components/payment/PaymentError";
import RevenueCatDebug from "./pages/RevenueCatDebug";
import PartnerVerifyPage from "./pages/PartnerVerifyPage";
import { initRevenueCat } from "@/lib/revenuecat";
import { loadTranslations } from "@/lib/i18n";
import { useUserStore } from "@/store/userStore";

const queryClient = new QueryClient();

// Initialize RevenueCat on app startup
initRevenueCat().catch(console.error);

// Preload translations for current language (after Zustand rehydrate)
setTimeout(() => {
  const lang = useUserStore.getState().language;
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
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter key={language}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/legal/:docType" element={<LegalPage />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/error" element={<PaymentError />} />
                  <Route path="/debug/revenuecat" element={<RevenueCatDebug />} />
                  <Route path="/revenuecat-debug" element={<RevenueCatDebug />} />
                  <Route path="/p/v/:token" element={<PartnerVerifyPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
