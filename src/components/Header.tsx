import React from 'react';
import { AppState, SyncStatus, computeLevel, fmt, triggerHaptic, downloadJsonBackup } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';
import { Copy, RefreshCw, Unlink, Download, Cloud, Flame, Check, Smartphone } from 'lucide-react';


interface HeaderProps {
  state: AppState;
  syncStatus: SyncStatus;
  syncMsg: string;
  gistId: string;
  token: string;
  onToggleHardMode: (checked: boolean) => void;
  onOpenSyncModal: () => void;
  onDisconnectGist: () => void;
  onManualSync: () => void;
  onOpenQrModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  syncStatus,
  syncMsg,
  gistId,
  token,
  onToggleHardMode,
  onOpenSyncModal,
  onDisconnectGist,
  onManualSync,
  onOpenQrModal,
}) => {
  const [copied, setCopied] = React.useState(false);
  const lvl = computeLevel(state.totalXP);
  const percentToNext = Math.min(100, Math.max(0, (lvl.into / lvl.span) * 100));

  const handleCopyGist = () => {
    if (!gistId) return;
    navigator.clipboard.writeText(gistId);
    setCopied(true);
    triggerHaptic(20);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSyncDotClass = () => {
    if (syncStatus === 'busy') return 'bg-[#A1791F] animate-pulse';
    if (syncStatus === 'err') return 'bg-[#9B3A2C]';
    if (syncStatus === 'ok') return 'bg-[#3E6B4E]';
    return gistId ? 'bg-[#3E6B4E]' : 'bg-[#6E6552]';
  };

  const getSyncLabel = () => {
    if (syncStatus === 'busy') return 'a sincronizar com o Gist…';
    if (syncStatus === 'err') return syncMsg || 'erro de ligação — dados no telemóvel';
    if (syncStatus === 'ok') return `sincronizado · ${syncMsg}`;
    return gistId ? 'ligado ao Gist privado' : 'modo local (offline)';
  };

  return (
    <header className="border-b-2 border-[#221F1A] pb-6 relative">
      {/* Top Ledger ID and Mobile Action Row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-3">
          <span className="font-mono-plex text-[11px] tracking-widest text-[#6E6552] uppercase bg-[#ECE3C8] px-2 py-0.5 border border-[#C7B583]/60">
            N.º 0001
          </span>
          <span className="text-[11px] font-mono-plex text-[#6E6552] hidden sm:inline">
            LIVRO DE LANÇAMENTOS PESSOAIS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQrModal}
            title="Abrir no telemóvel via QR Code"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-plex tracking-wider uppercase bg-[#FFFCF3] border border-[#28344A] text-[#28344A] hover:bg-[#ECE3C8] transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Abrir no Telemóvel</span>
          </button>
          <PWAInstallButton variant="button" />
        </div>
      </div>

      {/* Main Title */}
      <div className="mt-1">
        <h1 className="font-spectral-sc text-3xl sm:text-5xl font-bold tracking-wider text-[#28344A] leading-tight">
          RAZÃO XP
        </h1>
        <p className="font-spectral italic text-[#6E6552] text-sm sm:text-base mt-0.5">
          livro-razão pessoal — contas totalmente customizáveis e recompensas
        </p>
      </div>

      {/* XP & Level Summary Block */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-[#FFFCF3]/60 p-4 border border-[#C7B583]/80 shadow-xs">
        <div className="sm:col-span-4 border-b sm:border-b-0 sm:border-r border-[#C7B583]/50 pb-3 sm:pb-0 sm:pr-4">
          <span className="block font-mono-plex text-[10px] uppercase tracking-wider text-[#6E6552]">
            Crédito Total Acumulado
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono-plex text-3xl sm:text-4xl font-bold text-[#28344A]">
              {fmt(state.totalXP)}
            </span>
            <span className="font-mono-plex text-xs font-semibold text-[#A1791F]">XP</span>
          </div>
        </div>

        <div className="sm:col-span-8">
          <div className="flex justify-between items-baseline text-xs font-mono-plex mb-1.5 flex-wrap gap-1">
            <span className="font-semibold text-[#28344A] uppercase tracking-wider text-[11px]">
              Nível {lvl.level}
            </span>
            <span className="text-[#6E6552] text-[11px]">
              faltam <strong className="text-[#28344A]">{fmt(lvl.span - lvl.into)} XP</strong> para o Nível {lvl.level + 1}
            </span>
          </div>

          <div className="w-full h-3 bg-[#ECE3C8] border border-[#C7B583] overflow-hidden p-0.5 relative">
            <div
              className="h-full bg-[#A1791F] transition-all duration-500 ease-out"
              style={{ width: `${percentToNext}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono-plex text-[#6E6552] mt-1">
            <span>{fmt(lvl.into)} XP</span>
            <span>{percentToNext.toFixed(0)}% concluído</span>
            <span>{fmt(lvl.span)} XP</span>
          </div>
        </div>
      </div>

      {/* Hard Mode Toggle */}
      <div className="mt-4 p-3 bg-[#FFFCF3] border border-[#C7B583] flex items-start gap-3">
        <input
          type="checkbox"
          id="hardModeCheckbox"
          checked={state.hardMode}
          onChange={(e) => {
            triggerHaptic(20);
            onToggleHardMode(e.target.checked);
          }}
          className="mt-1 h-4 w-4 rounded-none accent-[#9B3A2C] cursor-pointer"
        />
        <label htmlFor="hardModeCheckbox" className="cursor-pointer select-none">
          <div className="flex items-center gap-1.5 font-mono-plex text-xs font-semibold text-[#9B3A2C]">
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>Modo Goggins — "nunca defino uma meta que consigo alcançar"</span>
          </div>
          <p className="text-[12px] text-[#6E6552] font-sans-plex mt-0.5 leading-snug">
            O XP ganho por cada lançamento é reduzido a <strong>60% (×0.6)</strong>; o custo dos prémios no Tesouro mantém-se.
          </p>
        </label>
      </div>

      {/* Sync & Connectivity Bar */}
      <div className="mt-3 py-2 px-3 bg-[#ECE3C8]/50 border border-[#C7B583]/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono-plex text-[#6E6552]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2.5 h-2.5 rounded-full inline-block ${getSyncDotClass()}`} />
          <span className="font-medium text-[#221F1A]">{getSyncLabel()}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {token && gistId ? (
            <>
              <button
                onClick={handleCopyGist}
                className="hover:text-[#28344A] underline flex items-center gap-1 transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#3E6B4E]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'ID copiado!' : 'copiar ID gist'}</span>
              </button>
              <button
                onClick={onManualSync}
                title="Sincronizar agora"
                className="hover:text-[#28344A] underline flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'busy' ? 'animate-spin' : ''}`} />
                <span>sincronizar</span>
              </button>
              <button
                onClick={onDisconnectGist}
                className="text-[#9B3A2C] hover:underline flex items-center gap-1 transition cursor-pointer"
              >
                <Unlink className="w-3 h-3" />
                <span>desligar</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenSyncModal}
              className="text-[#28344A] font-semibold hover:underline flex items-center gap-1 transition cursor-pointer bg-[#FFFCF3] px-2 py-0.5 border border-[#C7B583]"
            >
              <Cloud className="w-3 h-3 text-[#A1791F]" />
              <span>Importar Dados / Sincronizar</span>
            </button>
          )}

          <button
            onClick={onOpenSyncModal}
            title="Importar dados da app antiga ou gerir cópias de segurança"
            className="hover:text-[#28344A] underline flex items-center gap-1 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>importar / dados</span>
          </button>
        </div>
      </div>
    </header>
  );
};
