import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
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

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading, isAdmin, isApproved, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Admins always have access; non-approved users see waiting screen
  if (!isAdmin && !isApproved) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-sm text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-accent mx-auto" />
          <h2 className="text-lg font-display font-bold text-foreground">Aguardando aprovação</h2>
          <p className="text-sm text-muted-foreground">
            Sua conta foi criada com sucesso! O administrador precisa aprovar seu cadastro para você acessar o bolão.
          </p>
          <button
            onClick={() => { void import('@/integrations/supabase/client').then(m => m.supabase.auth.signOut()); }}
            className="text-sm text-muted-foreground underline"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/match/:matchId" element={<MatchDetailPage />} />
        <Route path="/bets" element={<MyBetsPage />} />
        <Route path="/knockout" element={<KnockoutPage />} />
        <Route path="/champion" element={<ChampionPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
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
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
