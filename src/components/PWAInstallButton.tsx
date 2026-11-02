import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, X, Info } from 'lucide-react';
import { triggerHaptic } from '../services/storage';

export const PWAInstallButton: React.FC<{ variant?: 'badge' | 'button' | 'banner' }> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [guideType, setGuideType] = useState<'android' | 'ios' | 'general'>('android');

  if (isInstalled) {
    if (variant === 'badge') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono-plex font-medium text-[#3E6B4E] bg-[#3E6B4E]/10 border border-[#3E6B4E]/30 rounded">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3E6B4E]" />
          <span>App Instalada</span>
        </span>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    triggerHaptic(30);
    if (isInstallable) {
      const ok = await install();
      if (!ok && (isAndroid || !isIOS)) {
        setGuideType('android');
        setShowGuide(true);
      }
    } else {
      if (isIOS) {
        setGuideType('ios');
      } else {
        setGuideType('android');
      }
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div className="bg-[#28344A] text-[#FFFCF3] border-b-2 border-[#A1791F] px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-mono-plex shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-[#A1791F]/20 border border-[#A1791F] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-[#FCE082]" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-[#FCE082]">Instalar Razão XP no Android</span>
              <span className="hidden sm:inline text-[#ECE3C8]/80 text-[11px] ml-2">
                Acesso direto offline e ecrã inteiro
              </span>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 flex items-center gap-1.5 bg-[#A1791F] hover:bg-[#8C6514] active:scale-95 text-[#FFFCF3] px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          title="Instalar como aplicação no telemóvel Android"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-plex font-medium tracking-wide uppercase bg-[#28344A] text-[#FFFCF3] hover:bg-[#3C4A65] active:scale-95 border border-[#C7B583] transition shadow-sm rounded-sm"
        >
          <Download className="w-3.5 h-3.5 text-[#FCE082]" />
          <span>{isAndroid ? 'Instalar no Android' : 'Instalar App'}</span>
        </button>
      )}

      {/* Modal Guide when browser ambient prompt is blocked or on Safari/Chrome */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-none bg-[#F4EFE0] border-2 border-[#28344A] shadow-2xl p-6 relative font-sans-plex text-[#221F1A]">
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-[#6E6552] hover:text-[#9B3A2C] transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-[#28344A]" />
              <h3 className="font-spectral-sc font-bold text-xl text-[#28344A]">
                {guideType === 'android' ? 'Instalar no Android (Chrome)' : guideType === 'ios' ? 'Instalar no iPhone / iPad' : 'Instalar Aplicação'}
              </h3>
            </div>

            {guideType === 'android' ? (
              <div className="space-y-3 text-sm text-[#221F1A]">
                <p className="font-semibold text-[#28344A]">
                  Se o Chrome continuar a criar apenas um atalho:
                </p>
                <p className="text-xs text-[#6E6552]">
                  O Chrome no Android memorizou a visita inicial antes da app ter os ficheiros de instalação. Segue estes passos rápidos para desbloquear a instalação real:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-xs font-mono-plex bg-[#ECE3C8]/70 p-3 border border-[#C7B583]">
                  <li>
                    <strong>Apaga o atalho</strong> antigo do teu ecrã inicial do telemóvel.
                  </li>
                  <li>
                    No Chrome do telemóvel, toca no ícone de <strong>definições / cadeado</strong> à esquerda do endereço URL.
                  </li>
                  <li>
                    Toca em <strong>"Definições de sites"</strong> (ou <em>Cookies e dados de sites</em>) → <strong>"Eliminar e repor"</strong> (ou <em>Limpar dados</em>).
                  </li>
                  <li>
                    Fecha o separador do Chrome e volta a abrir o link:
                    <br />
                    <code className="text-[10px] break-all text-[#28344A] bg-white p-1 block mt-1">
                      https://ais-pre-kscmtugyijoyesqmmamflm-715381697577.europe-west1.run.app
                    </code>
                  </li>
                  <li>
                    Aguarda 2 a 3 segundos e toca no botão <strong>"Instalar"</strong> dourado no topo!
                  </li>
                </ol>
                <p className="text-xs text-[#3E6B4E] font-medium">
                  ✓ O Chrome abrirá o diálogo nativo <strong>"Instalar aplicação Razão XP"</strong> com o ícone próprio.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-[#221F1A]">
                <p>No Safari do iPhone ou iPad:</p>
                <ol className="list-decimal pl-5 space-y-2 text-xs font-mono-plex bg-[#ECE3C8]/70 p-3 border border-[#C7B583]">
                  <li>Toca no botão <strong>Partilhar</strong> (ícone de quadrado com seta para cima).</li>
                  <li>Desce na lista e toca em <strong>"Ecrã Principal"</strong> (+)</li>
                  <li>Toca em <strong>"Adicionar"</strong> no canto superior direito.</li>
                </ol>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-[#C7B583] flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="bg-[#28344A] text-[#FFFCF3] hover:bg-[#3C4A65] px-4 py-2 text-xs font-mono-plex uppercase tracking-wider font-semibold transition"
              >
                Compreendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
