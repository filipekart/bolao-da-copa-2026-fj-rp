import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ActiveProfileProvider } from "@/lib/activeProfile";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/lib/theme";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import MatchDetailPage from "./pages/MatchDetailPage";
import MyBetsPage from "./pages/MyBetsPage";
import KnockoutPage from "./pages/KnockoutPage";
import RankingPage from "./pages/RankingPage";
import ExtrasPage from "./pages/ExtrasPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import { Loader2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes — avoid refetch on every window focus
      refetchOnWindowFocus: true, // still refetch, but only after staleTime
      retry: 1,
    },
  },
});

function ProtectedRoutes() {
  const { user, loading, isAdmin, isApproved, profileLoading } = useAuth();
  const { t } = useTranslation();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin && !isApproved) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-sm text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-accent mx-auto" />
          <h2 className="text-lg font-display font-bold text-foreground">{t('approval.title')}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {t('approval.message')}
          </p>
          <button
            onClick={() => { void import('@/integrations/supabase/client').then(m => m.supabase.auth.signOut()); }}
            className="text-sm text-muted-foreground underline"
          >
            {t('approval.signOut')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ActiveProfileProvider>
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/match/:matchId" element={<MatchDetailPage />} />
        <Route path="/bets" element={<MyBetsPage />} />
        <Route path="/knockout" element={<KnockoutPage />} />
        <Route path="/extras" element={<ExtrasPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
    </ActiveProfileProvider>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthGuard />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
