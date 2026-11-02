import React, { useState } from 'react';
import { Reward } from '../types';
import { fmt, triggerHaptic } from '../services/storage';
import { Award, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface TreasurySectionProps {
  rewards: Reward[];
  onAddReward: (name: string, costEUR?: number, directXP?: number) => void;
  onRemoveReward: (id: string) => void;
}

export const TreasurySection: React.FC<TreasurySectionProps> = ({
  rewards,
  onAddReward,
  onRemoveReward,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [costEUR, setCostEUR] = useState('');
  const [directXP, setDirectXP] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cost = parseFloat(costEUR);
    const xp = parseFloat(directXP);

    onAddReward(
      name.trim(),
      !isNaN(cost) && cost > 0 ? cost : undefined,
      !isNaN(xp) && xp > 0 ? xp : undefined
    );

    setName('');
    setCostEUR('');
    setDirectXP('');
    setShowAddForm(false);
    triggerHaptic(25);
  };

  return (
    <div className="space-y-4">
      {/* Top Section Note & Add Button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-spectral italic text-[#6E6552] text-xs sm:text-sm">
          Cada lançamento atribui o XP ganho aleatoriamente a um prémio em curso no Tesouro.
        </p>

        <button
          onClick={() => {
            triggerHaptic(15);
            setShowAddForm(!showAddForm);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-plex tracking-wider uppercase bg-[#FFFCF3] border border-[#28344A] text-[#28344A] hover:bg-[#ECE3C8] transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Fechar Formulário' : '+ Adicionar Prémio'}</span>
        </button>
      </div>

      {/* Add Reward Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#ECE3C8] border-2 border-dashed border-[#C7B583] p-4 sm:p-5 space-y-3"
        >
          <h4 className="font-spectral-sc font-bold text-sm uppercase text-[#28344A] tracking-wider">
            Novo Prémio para o Tesouro
          </h4>

          <div>
            <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
              Nome do Prémio / Recompensa
            </label>
            <input
              type="text"
              required
              placeholder="ex: Cadeira ergonómica de escritório, Livro novo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-sm font-sans-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
                Custo em € (calcula ~100 XP por Euro)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="ex: 15"
                value={costEUR}
                onChange={(e) => {
                  setCostEUR(e.target.value);
                  if (e.target.value) setDirectXP('');
                }}
                className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-xs font-mono-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
                Ou definir XP diretamente
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="ex: 1500"
                value={directXP}
                onChange={(e) => {
                  setDirectXP(e.target.value);
                  if (e.target.value) setCostEUR('');
                }}
                className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-xs font-mono-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-mono-plex text-[#6E6552] hover:text-[#221F1A]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#28344A] text-[#FFFCF3] px-4 py-2 text-xs font-mono-plex uppercase tracking-wider hover:bg-[#3C4A65] transition"
            >
              Guardar no Tesouro
            </button>
          </div>
        </form>
      )}

      {/* Rewards Grid */}
      {rewards.length === 0 ? (
        <div className="bg-[#FFFCF3] border border-[#C7B583] p-8 text-center">
          <Award className="w-8 h-8 text-[#6E6552] mx-auto mb-2 opacity-40" />
          <p className="font-spectral italic text-[#6E6552] text-sm">
            O tesouro está vazio. Adiciona um prémio para o teu esforço ser recompensado!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rewards.map((r) => {
            const pct = Math.min(100, (r.xpEarned / r.xpRequired) * 100);
            return (
              <div
                key={r.id}
                className="relative bg-[#FFFCF3] border border-[#C7B583] p-4 sm:p-5 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Completed Stamp */}
                {r.completed && (
                  <div className="absolute top-3 right-3 w-20 h-20 rounded-full stamp-acquired flex items-center justify-center text-center p-1 select-none pointer-events-none z-10">
                    <span className="text-[10px] leading-tight font-extrabold uppercase">
                      ADQUIRIDO
                    </span>
                  </div>
                )}

                <div>
                  <h4
                    className={`font-spectral text-lg font-semibold text-[#28344A] mb-1 pr-14 ${
                      r.completed ? 'line-through text-[#6E6552]' : ''
                    }`}
                  >
                    {r.name}
                  </h4>

                  <div className="font-mono-plex text-xs text-[#6E6552] mb-3 flex items-center gap-1.5">
                    {r.costEUR && <span>{r.costEUR}€ · </span>}
                    <span className="font-semibold text-[#221F1A]">{fmt(r.xpEarned)}</span>
                    <span>/</span>
                    <span>{fmt(r.xpRequired)} XP</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-[#ECE3C8] border border-[#C7B583] overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        r.completed ? 'bg-[#3E6B4E]' : 'bg-[#A1791F]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-plex text-[#6E6552]">
                    <span>{pct.toFixed(1)}%</span>
                    {r.completed ? (
                      <span className="text-[#3E6B4E] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Meta Alcançada!
                      </span>
                    ) : (
                      <span>Faltam {fmt(r.xpRequired - r.xpEarned)} XP</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#C7B583]/40 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm(`Remover o prémio "${r.name}" do tesouro?`)) {
                        triggerHaptic(20);
                        onRemoveReward(r.id);
                      }
                    }}
                    className="text-[#9B3A2C] font-mono-plex text-[11px] underline hover:text-red-700 transition cursor-pointer"
                  >
                    remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
