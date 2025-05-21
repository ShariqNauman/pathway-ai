import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { useEffect } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EssayAnalyzerPage from "./pages/EssayAnalyzerPage";
import ConsultantPage from "./pages/ConsultantPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import { ThemeProvider } from "./components/ThemeProvider";
import SmartRecommenderPage from './pages/SmartRecommenderPage';
import { AuthProvider } from './contexts/AuthContext';
import PricingPage from "./pages/PricingPage";

// Create a new queryClient with proper configuration for auth persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ScrollToTop component to handle navigation behavior
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  
  useEffect(() => {
    // Only scroll to top on PUSH navigation (not on POP or REPLACE)
    if (navigationType === 'PUSH') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);
  
  return null;
};

const App = () => (
  <HelmetProvider>
    <ThemeProvider defaultTheme="light">
      <UserProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {/* Show toast notifications */}
              <Toaster position="bottom-right" closeButton={true} />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile/edit" element={<ProfileEditPage />} />
                  <Route path="/essay-analyzer" element={<EssayAnalyzerPage />} />
                  <Route path="/consultant" element={<ConsultantPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/recommender" element={<SmartRecommenderPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </AuthProvider>
      </UserProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
