import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <User className="w-5 h-5 text-primary" /> Perfil
      </h1>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-pitch flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-foreground font-medium">
              {user?.user_metadata?.display_name ?? user?.email?.split('@')[0]}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <Button
        onClick={signOut}
        variant="outline"
        className="w-full border-border text-foreground hover:bg-secondary"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
}
