import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';

const matchRules = [
  { label: 'Placar exato', points: 25, example: 'Palpite 2×1, Real 2×1' },
  { label: 'Vencedor + gols do vencedor', points: 18, example: 'Palpite 3×1, Real 3×0' },
  { label: 'Vencedor + gols do perdedor', points: 12, example: 'Palpite 2×1, Real 3×1' },
  { label: 'Apenas resultado certo', points: 10, example: 'Palpite 1×0, Real 2×0' },
  { label: 'Empate (não exato)', points: 10, example: 'Palpite 1×1, Real 0×0' },
  { label: 'Errou', points: 0, example: 'Palpite 1×0, Real 0×1' },
];

const extraRules = [
  { label: 'Campeão', points: 100 },
  { label: 'Artilheiro', points: 50 },
  { label: 'MVP', points: 50 },
];

export function RulesModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-primary transition-colors" title="Regras">
          <HelpCircle className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="glass border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display">Regras de Pontuação</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Match predictions */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">⚽ Palpites por Jogo</h3>
            <div className="space-y-1.5">
              {matchRules.map(r => (
                <div key={r.label} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground">{r.example}</p>
                  </div>
                  <span className="text-primary font-bold whitespace-nowrap">{r.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extra predictions */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">🏆 Palpites Extras</h3>
            <div className="space-y-1.5">
              {extraRules.map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-foreground">{r.label}</span>
                  <span className="text-primary font-bold">{r.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* General rules */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">📋 Regras Gerais</h3>
            <ul className="space-y-1 text-muted-foreground text-xs list-disc pl-4">
              <li>Apostas são bloqueadas no horário de início de cada jogo.</li>
              <li>Palpites de campeão, artilheiro e MVP são bloqueados após o início do primeiro jogo da Copa.</li>
              <li>No mata-mata, considere o placar do tempo regulamentar + prorrogação (sem pênaltis).</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
