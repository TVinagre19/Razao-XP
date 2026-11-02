import React, { useState, useEffect, useMemo } from 'react';
import { Account, AppState, Reward } from '../types';
import { HARD_MODE_MULTIPLIER, fmt, triggerHaptic } from '../services/storage';
import { Sparkles, Check, ArrowRight, PlusCircle, AlertCircle } from 'lucide-react';

interface NewEntrySectionProps {
  accounts: Account[];
  rewards: Reward[];
  hardMode: boolean;
  onLogEntry: (accountId: string, values: Record<string, any>) => Promise<{ xp: number; rewardName?: string } | null>;
  onGoToAccounts: () => void;
}

export const NewEntrySection: React.FC<NewEntrySectionProps> = ({
  accounts,
  rewards,
  hardMode,
  onLogEntry,
  onGoToAccounts,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [resultMsg, setResultMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedAccountId if accounts change
  useEffect(() => {
    if (!accounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(accounts[0]?.id || '');
      setFieldValues({});
    }
  }, [accounts, selectedAccountId]);

  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId);
  }, [accounts, selectedAccountId]);

  // Reset fields when account changes
  const handleAccountChange = (id: string) => {
    setSelectedAccountId(id);
    setFieldValues({});
    setResultMsg(null);
  };

  const handleNumberChange = (fieldId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setFieldValues((prev) => ({ ...prev, [fieldId]: num }));
  };

  const handleCheckboxChange = (fieldId: string, checked: boolean) => {
    triggerHaptic(15);
    setFieldValues((prev) => ({ ...prev, [fieldId]: checked }));
  };

  // Real-time XP preview calculation
  const calculatedXP = useMemo(() => {
    if (!currentAccount) return { xp: 0, parts: [], bonusBreakdown: [] };

    let total = 0;
    const parts: string[] = [];
    const bonusBreakdown: string[] = [];

    currentAccount.fields.forEach((f) => {
      if (f.type === 'number') {
        const v = parseFloat(fieldValues[f.id]) || 0;
        const baseXP = v * (Number(f.xpPerUnit) || 0);
        total += baseXP;

        let bonusAdded = 0;
        if (
          f.bonusThreshold !== null &&
          f.bonusThreshold !== undefined &&
          f.bonusThreshold !== ('' as any) &&
          v >= Number(f.bonusThreshold)
        ) {
          bonusAdded = Number(f.bonusXP) || 0;
          total += bonusAdded;
          bonusBreakdown.push(`Bónus por atingir ≥ ${f.bonusThreshold} ${f.label.toLowerCase()} (+${bonusAdded} XP)`);
        }

        if (v > 0) {
          parts.push(`${v} ${f.label.toLowerCase()}`);
        }
      } else if (f.type === 'checkbox') {
        if (fieldValues[f.id]) {
          let b = Number(f.xpBonus) || 0;
          let multBonus = 0;
          if (f.multiplyFieldId) {
            const mv = parseFloat(fieldValues[f.multiplyFieldId]) || 0;
            multBonus = mv * (Number(f.multiplier) || 0);
            b += multBonus;
          }
          total += b;
          parts.push(f.label);
          if (multBonus > 0) {
            bonusBreakdown.push(`${f.label}: +${Number(f.xpBonus) || 0} fixo + ${multBonus.toFixed(0)} multiplicador`);
          }
        }
      }
    });

    if (hardMode) {
      total = total * HARD_MODE_MULTIPLIER;
    }

    return {
      xp: Math.round(total),
      parts,
      desc: parts.length ? parts.join(' · ') : '—',
      bonusBreakdown,
    };
  }, [currentAccount, fieldValues, hardMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;
    if (calculatedXP.xp <= 0) {
      setResultMsg({
        type: 'err',
        text: 'Preenche pelo menos um valor válido antes de efetuar o lançamento no livro.',
      });
      return;
    }

    setIsSubmitting(true);
    triggerHaptic(35);

    const res = await onLogEntry(currentAccount.id, fieldValues);
    setIsSubmitting(false);

    if (res) {
      setFieldValues({});
      setResultMsg({
        type: 'ok',
        text: `+${fmt(res.xp)} XP lançados com sucesso!${
          res.rewardName
            ? ` Atribuídos ao prémio "${res.rewardName}".`
            : ' Adiciona um prémio no Tesouro para começares a acumular.'
        }`,
      });
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-[#FFFCF3] border border-[#C7B583] p-6 text-center">
        <p className="font-spectral italic text-[#6E6552] text-base mb-4">
          Ainda não tens nenhuma conta de XP criada.
        </p>
        <button
          onClick={onGoToAccounts}
          className="inline-flex items-center gap-2 bg-[#28344A] text-[#FFFCF3] px-4 py-2 font-mono-plex text-xs uppercase tracking-wider hover:bg-[#3C4A65] transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar a Primeira Conta em Gerir</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFCF3] border border-[#C7B583] p-5 sm:p-6 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Account Selector */}
        <div>
          <label className="block font-mono-plex text-[11px] uppercase tracking-wider text-[#6E6552] mb-1.5">
            Conta de Lançamento
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="w-full bg-[#FFFCF3] border-2 border-[#C7B583] p-2.5 font-sans-plex text-sm text-[#221F1A] focus:border-[#28344A] focus:outline-hidden transition"
          >
            {accounts.map((acc, index) => (
              <option key={acc.id} value={acc.id}>
                Conta {String(index + 1).padStart(2, '0')} — {acc.name} ({fmt(acc.total || 0)} XP)
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields of the account */}
        {currentAccount && (
          <div className="pt-2 border-t border-[#C7B583]/50">
            <span className="block font-mono-plex text-[10px] uppercase tracking-wider text-[#6E6552] mb-3">
              Métricas e Atividades
            </span>

            {currentAccount.fields.length === 0 ? (
              <div className="bg-[#ECE3C8]/40 border border-[#C7B583] p-4 text-xs font-mono-plex text-[#6E6552]">
                Esta conta ainda não possui campos configurados. Configura métricas na secção "Gerir Contas".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentAccount.fields.map((f) => {
                  if (f.type === 'number') {
                    const val = fieldValues[f.id] ?? '';
                    return (
                      <div
                        key={f.id}
                        className="bg-[#F4EFE0]/70 border border-[#C7B583] p-3 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <label className="font-mono-plex text-xs font-semibold uppercase tracking-wide text-[#28344A]">
                            {f.label}
                          </label>
                          <span className="text-[10px] font-mono-plex text-[#6E6552] bg-[#ECE3C8] px-1.5 py-0.5 border border-[#C7B583]/60">
                            {f.xpPerUnit ?? 0} XP/unid
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            value={val}
                            onChange={(e) => handleNumberChange(f.id, e.target.value)}
                            className="w-full bg-[#FFFCF3] border border-[#C7B583] px-3 py-2 font-mono-plex text-base text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
                          />
                          {f.bonusThreshold && (
                            <span
                              title={`Bónus de +${f.bonusXP} XP se atingir ${f.bonusThreshold}`}
                              className="text-[10px] font-mono-plex text-[#A1791F] shrink-0"
                            >
                              ≥{f.bonusThreshold} → +{f.bonusXP}XP
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Checkbox field
                  const checked = Boolean(fieldValues[f.id]);
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleCheckboxChange(f.id, !checked)}
                      className={`border p-3 flex items-center gap-3 cursor-pointer select-none transition ${
                        checked
                          ? 'bg-[#3E6B4E]/10 border-[#3E6B4E]'
                          : 'bg-[#F4EFE0]/70 border-[#C7B583] hover:bg-[#ECE3C8]/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => handleCheckboxChange(f.id, e.target.checked)}
                        className="h-5 w-5 rounded-none accent-[#3E6B4E] cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-sans-plex text-sm font-medium text-[#221F1A] block">
                          {f.label}
                        </span>
                        <span className="text-[10px] font-mono-plex text-[#6E6552]">
                          +{f.xpBonus ?? 0} XP
                          {f.multiplyFieldId && f.multiplier ? ` (+${f.multiplier}× multi)` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Real-time Calculation Preview Card */}
        {calculatedXP.xp > 0 && (
          <div className="bg-[#28344A] text-[#FFFCF3] p-4 border border-[#A1791F] flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono-plex text-[#FCE082] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#FCE082]" />
                <span>Cálculo Prévia do Lançamento</span>
              </div>
              <p className="text-xs font-mono-plex text-[#ECE3C8] mt-0.5">
                {calculatedXP.desc}
              </p>
              {calculatedXP.bonusBreakdown.length > 0 && (
                <div className="text-[11px] font-mono-plex text-[#D4AF37] mt-1 space-y-0.5">
                  {calculatedXP.bonusBreakdown.map((b, i) => (
                    <div key={i}>★ {b}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="block font-mono-plex text-2xl font-bold text-[#FCE082]">
                +{fmt(calculatedXP.xp)} XP
              </span>
              {hardMode && (
                <span className="text-[10px] font-mono-plex text-[#ECE3C8]/80">
                  Modo Goggins ativo (×0.6)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting || calculatedXP.xp <= 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#28344A] hover:bg-[#3C4A65] active:scale-98 disabled:opacity-50 text-[#FFFCF3] px-6 py-3 font-mono-plex text-xs uppercase tracking-widest font-semibold transition cursor-pointer shadow-sm border border-[#C7B583]"
          >
            <Check className="w-4 h-4 text-[#FCE082]" />
            <span>Lançar no Livro</span>
          </button>
        </div>

        {/* Flash Message */}
        {resultMsg && (
          <div
            className={`p-3 text-xs font-mono-plex border flex items-center gap-2 transition ${
              resultMsg.type === 'ok'
                ? 'bg-[#3E6B4E]/10 border-[#3E6B4E] text-[#3E6B4E]'
                : 'bg-[#9B3A2C]/10 border-[#9B3A2C] text-[#9B3A2C]'
            }`}
          >
            {resultMsg.type === 'ok' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{resultMsg.text}</span>
          </div>
        )}
      </form>
    </div>
  );
};
