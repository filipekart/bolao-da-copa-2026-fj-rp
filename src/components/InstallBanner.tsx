import { useState, useEffect } from 'react';
import { Download, X, Share, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'install_banner_dismissed';

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Don't show in iframe
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // Only show on mobile
    if (ios || android) {
      setVisible(true);
    }
  }, []);

  if (!visible || isStandalone) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="mx-auto max-w-lg mb-3 animate-in slide-in-from-top-2 duration-300">
      <div className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              📲 Instale o Bolão Copa!
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Use como um app no seu celular, com ícone na tela inicial e tela cheia.
            </p>

            {isIOS && (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No iPhone (Safari):</p>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
                  <span>Toque no botão <Share className="inline w-3.5 h-3.5 text-primary -mt-0.5" /> <strong>Compartilhar</strong> na barra inferior</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">2</span>
                  <span>Role para baixo e toque em <Plus className="inline w-3.5 h-3.5 text-primary -mt-0.5" /> <strong>Adicionar à Tela de Início</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">3</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito</span>
                </div>
              </div>
            )}

            {isAndroid && (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">No Android (Chrome):</p>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</span>
                  <span>Toque no menu <MoreVertical className="inline w-3.5 h-3.5 text-primary -mt-0.5" /> (três pontinhos) no canto superior</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">2</span>
                  <span>Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">3</span>
                  <span>Confirme tocando em <strong>Instalar</strong></span>
                </div>
              </div>
            )}

            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-7 mt-3 text-muted-foreground">
              Entendi, não mostrar novamente
            </Button>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
