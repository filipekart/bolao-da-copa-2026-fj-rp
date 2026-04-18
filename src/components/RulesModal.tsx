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
  { label: 'Empate (não exato)', points: 16, example: 'Palpite 1×1, Real 0×0' },
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
        <button
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-border bg-card/95 p-2 text-destructive shadow-sm backdrop-blur transition-transform hover:scale-[1.02]"
          title="Regras"
          aria-label="Abrir regras"
        >
          <HelpCircle className="w-6 h-6" />
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

          {/* Prizes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">💰 Premiação</h3>
            <div className="space-y-1.5">
              <p className="text-foreground text-xs font-medium">Parciais — 20% do total</p>
              <div className="space-y-2 text-muted-foreground text-xs pl-4">
                <div>
                  <div className="flex justify-between"><span className="text-foreground">1ª rodada da fase de grupos</span><span className="text-primary font-semibold">3%</span></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Maior pontuação somando apenas os jogos da rodada 1</p>
                </div>
                <div>
                  <div className="flex justify-between"><span className="text-foreground">2ª rodada da fase de grupos</span><span className="text-primary font-semibold">3%</span></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Somando apenas os jogos da rodada 2</p>
                </div>
                <div>
                  <div className="flex justify-between"><span className="text-foreground">3ª rodada da fase de grupos</span><span className="text-primary font-semibold">3%</span></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Somando apenas os jogos da rodada 3</p>
                </div>
                <div>
                  <div className="flex justify-between"><span className="text-foreground">Campeão da 1ª fase (fase de grupos)</span><span className="text-primary font-semibold">6%</span></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Maior pontuação somando todos os jogos da fase de grupos (rodadas 1 + 2 + 3)</p>
                </div>
                <div>
                  <div className="flex justify-between"><span className="text-foreground">Campeão da 2ª fase (mata-mata) + Extras</span><span className="text-primary font-semibold">5%</span></div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Soma dos jogos do mata-mata (16-avos até a Final, incluindo Disputa do 3º) + acertos de Campeão, Artilheiro e MVP</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-foreground text-xs font-medium">🏅 Ranking final — 80% do total</p>
              <div className="space-y-0.5 text-muted-foreground text-xs pl-4">
                <div className="flex justify-between"><span>1º geral</span><span className="text-primary font-semibold">35%</span></div>
                <div className="flex justify-between"><span>2º geral</span><span className="text-primary font-semibold">19%</span></div>
                <div className="flex justify-between"><span>3º geral</span><span className="text-primary font-semibold">10%</span></div>
                <div className="flex justify-between"><span>4º geral</span><span className="text-primary font-semibold">5%</span></div>
                <div className="flex justify-between"><span>5º geral</span><span className="text-primary font-semibold">3%</span></div>
                <div className="flex justify-between"><span>6º geral</span><span className="text-primary font-semibold">2,5%</span></div>
                <div className="flex justify-between"><span>7º geral</span><span className="text-primary font-semibold">2%</span></div>
                <div className="flex justify-between"><span>8º geral</span><span className="text-primary font-semibold">1,5%</span></div>
                <div className="flex justify-between"><span>9º geral</span><span className="text-primary font-semibold">1%</span></div>
                <div className="flex justify-between"><span>10º geral</span><span className="text-primary font-semibold">1%</span></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
