import React from 'react';
import { Account } from '../types';
import { fmt, triggerHaptic } from '../services/storage';
import { Layers, Plus, ArrowUpRight } from 'lucide-react';

interface AccountsSectionProps {
  accounts: Account[];
  onSelectAccountForEntry: (id: string) => void;
  onGoToManager: () => void;
}

export const AccountsSection: React.FC<AccountsSectionProps> = ({
  accounts,
  onSelectAccountForEntry,
  onGoToManager,
}) => {
  if (accounts.length === 0) {
    return (
      <div className="bg-[#FFFCF3] border border-[#C7B583] p-8 text-center">
        <Layers className="w-8 h-8 text-[#6E6552] mx-auto mb-2 opacity-50" />
        <p className="font-spectral italic text-[#6E6552] text-sm">
          Sem contas registadas. Cria uma conta na secção "Gerir Contas".
        </p>
        <button
          onClick={onGoToManager}
          className="mt-4 bg-[#28344A] text-[#FFFCF3] px-4 py-2 font-mono-plex text-xs uppercase tracking-wider inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Conta</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-spectral font-semibold text-xs uppercase tracking-widest text-[#6E6552]">
          Balanço Atual por Conta
        </span>
        <button
          onClick={onGoToManager}
          className="text-xs font-mono-plex text-[#28344A] underline hover:text-[#A1791F] transition"
        >
          + editar / adicionar contas
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {accounts.map((acc, index) => (
          <div
            key={acc.id}
            onClick={() => {
              triggerHaptic(15);
              onSelectAccountForEntry(acc.id);
            }}
            className="group bg-[#FFFCF3] border border-[#C7B583] p-4 hover:border-[#28344A] transition cursor-pointer relative shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono-plex text-[10px] text-[#A1791F] tracking-widest font-semibold uppercase">
                  Conta {String(index + 1).padStart(2, '0')}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#6E6552] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-spectral font-semibold text-lg text-[#28344A] mt-1 mb-3 truncate">
                {acc.name}
              </h3>
            </div>

            <div className="pt-2 border-t border-[#C7B583]/40 flex items-baseline justify-between">
              <span className="text-[11px] font-mono-plex text-[#6E6552]">Saldo:</span>
              <div className="font-mono-plex text-xl font-bold text-[#221F1A]">
                <span className="text-[#3E6B4E]">{fmt(acc.total || 0)}</span>{' '}
                <span className="text-xs text-[#6E6552] font-normal">XP</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
