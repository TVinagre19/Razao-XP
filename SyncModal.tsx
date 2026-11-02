import React, { useState } from 'react';
import {
  Cloud,
  X,
  ExternalLink,
  Download,
  Upload,
  CheckCircle2,
  ClipboardPaste,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  Database,
  Globe,
  FolderArchive,
} from 'lucide-react';
import { AppState, downloadJsonBackup, triggerHaptic, safeMerge } from '../services/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  gistId: string;
  state: AppState;
  onConnect: (token: string, gistId?: string) => Promise<string | void>;
  onImportBackup: (importedState: AppState) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  token: initialToken,
  gistId: initialGistId,
  state,
  onConnect,
  onImportBackup,
}) => {
  const [modalTab, setModalTab] = useState<'ghpages' | 'migrate' | 'gist' | 'backup'>('ghpages');
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [gistInput, setGistInput] = useState(initialGistId);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdGistId, setCreatedGistId] = useState('');

  // Migration raw text
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const extractSnippet = `const d = localStorage.getItem('rx-cache'); if(d) { copy(d); alert('Dados copiados para a área de transferência! Cola-os na nova app.'); } else { alert('Sem dados encontrados em rx-cache.'); }`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(extractSnippet);
    setCopiedScript(true);
    triggerHaptic(20);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleImportPastedJson = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!pasteJsonText.trim()) {
      setErrorMsg('Cola primeiro o texto JSON dos teus dados.');
      return;
    }

    try {
      const parsed = JSON.parse(pasteJsonText.trim());
      if (parsed && (typeof parsed.totalXP === 'number' || Array.isArray(parsed.accounts))) {
        const merged = safeMerge(parsed);
        onImportBackup(merged);
        triggerHaptic(35);
        setSuccessMsg(
          `Sucesso! Foram importados ${merged.accounts.length} contas, ${merged.logs.length} registos e ${merged.totalXP} XP.`
        );
        setPasteJsonText('');
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg('O texto colado não contém um formato de dados reconhecido do Razão XP.');
      }
    } catch (e: any) {
      setErrorMsg('Erro ao processar JSON: ' + (e.message || 'formato inválido.'));
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Insere o teu Personal Access Token do GitHub.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    triggerHaptic(20);

    try {
      const newId = await onConnect(tokenInput.trim(), gistInput.trim() || undefined);
      if (newId) {
        setCreatedGistId(newId);
      } else {
        setSuccessMsg('Ligação ao Gist restabelecida e dados sincronizados!');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao ligar ao GitHub Gist.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (typeof parsed.totalXP === 'number' || Array.isArray(parsed.accounts))) {
          const merged = safeMerge(parsed);
          onImportBackup(merged);
          triggerHaptic(30);
          setSuccessMsg(`Ficheiro importado! ${merged.accounts.length} contas e ${merged.totalXP} XP carregados.`);
          setTimeout(() => onClose(), 1500);
        } else {
          setErrorMsg('O ficheiro JSON não possui a estrutura correta do Razão XP.');
        }
      } catch (err) {
        setErrorMsg('Erro ao ler o ficheiro JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#F4EFE0] border-2 border-[#28344A] shadow-2xl p-5 sm:p-6 relative font-sans-plex text-[#221F1A] my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6E6552] hover:text-[#9B3A2C] transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Database className="w-6 h-6 text-[#28344A]" />
          <h2 className="font-spectral-sc font-bold text-2xl text-[#28344A]">
            Dados & Sincronização
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-[#6E6552] mb-4">
          Gere os teus dados, migra o histórico da versão anterior ou sincroniza via GitHub Gist.
        </p>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#C7B583] mb-4 overflow-x-auto text-xs font-mono-plex">
          <button
            onClick={() => {
              setModalTab('ghpages');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-2 border-b-2 font-semibold uppercase tracking-wider whitespace-nowrap transition ${
              modalTab === 'ghpages'
                ? 'border-[#28344A] text-[#28344A] bg-[#ECE3C8]/50'
                : 'border-transparent text-[#6E6552] hover:text-[#28344A]'
            }`}
          >
            GitHub Pages (PWA Real)
          </button>
          <button
            onClick={() => {
              setModalTab('migrate');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-2 border-b-2 font-semibold uppercase tracking-wider whitespace-nowrap transition ${
              modalTab === 'migrate'
                ? 'border-[#28344A] text-[#28344A] bg-[#ECE3C8]/50'
                : 'border-transparent text-[#6E6552] hover:text-[#28344A]'
            }`}
          >
            Migrar Dados
          </button>
          <button
            onClick={() => {
              setModalTab('gist');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-2 border-b-2 font-semibold uppercase tracking-wider transition ${
              modalTab === 'gist'
                ? 'border-[#28344A] text-[#28344A] bg-[#ECE3C8]/50'
                : 'border-transparent text-[#6E6552] hover:text-[#28344A]'
            }`}
          >
            GitHub Gist
          </button>
          <button
            onClick={() => {
              setModalTab('backup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-2 border-b-2 font-semibold uppercase tracking-wider transition ${
              modalTab === 'backup'
                ? 'border-[#28344A] text-[#28344A] bg-[#ECE3C8]/50'
                : 'border-transparent text-[#6E6552] hover:text-[#28344A]'
            }`}
          >
            Ficheiro Local
          </button>
        </div>

        {/* TAB 0: GITHUB PAGES */}
        {modalTab === 'ghpages' && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#ECE3C8]/60 border border-[#C7B583] p-3 text-xs leading-relaxed space-y-2">
              <span className="font-mono-plex font-bold uppercase text-[10px] text-[#28344A] block">
                Alojamento Gratuito & PWA 100% Funcional no Android
              </span>
              <p>
                No ambiente de testes do AI Studio, o Chrome e outros navegadores no Android não conseguem criar o pacote nativo da app devido aos cookies de login do Google. Alojando no teu próprio <strong>GitHub Pages</strong>, o teu site fica 100% público, seguro (HTTPS) e o Chrome <strong>instala a aplicação real em ecrã inteiro imediatamente</strong>!
              </p>
            </div>

            <div className="bg-[#FFFCF3] border border-[#C7B583] p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#C7B583]/50">
                <div>
                  <h4 className="font-spectral font-bold text-sm text-[#28344A]">
                    Pacote Completo Pré-compilado (.zip)
                  </h4>
                  <p className="text-[11px] text-[#6E6552]">
                    Já configurado com links relativos para qualquer repositório do GitHub.
                  </p>
                </div>

                <a
                  href="./razao-xp-github-pages.zip"
                  download="razao-xp-github-pages.zip"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#28344A] text-[#FFFCF3] text-xs font-mono-plex uppercase font-semibold hover:bg-[#3C4A65] transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#FCE082]" />
                  <span>Descarregar .ZIP</span>
                </a>
              </div>

              <div className="space-y-2 text-[#221F1A]">
                <span className="font-mono-plex font-bold uppercase text-[10px] text-[#6E6552] block">
                  Passo a passo (3 minutos no GitHub):
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                  <li>
                    Abre{' '}
                    <a
                      href="https://github.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-[#28344A] inline-flex items-center gap-0.5"
                    >
                      github.com/new <ExternalLink className="w-3 h-3 inline" />
                    </a>{' '}
                    e cria um repositório <strong>Público</strong> (ex: com o nome <code>razao-xp</code>).
                  </li>
                  <li>
                    Descarrega o ficheiro <strong>razao-xp-github-pages.zip</strong> acima e descompacta os ficheiros no teu computador.
                  </li>
                  <li>
                    No GitHub, no novo repositório criado, clica em <strong>"uploading an existing file"</strong> e arrasta todos os ficheiros da pasta descompactada para lá (incluindo a pasta <em>assets</em>, <em>index.html</em>, etc.). Depois clica em <strong>Commit changes</strong>.
                  </li>
                  <li>
                    No teu repositório, clica no menu <strong>Settings</strong> → <strong>Pages</strong> (menu lateral).
                  </li>
                  <li>
                    Em <em>Build and deployment</em>, seleciona a branch <code>main</code> e a pasta <code>/ (root)</code>, e clica em <strong>Save</strong>.
                  </li>
                  <li>
                    Em cerca de 1 minuto, o teu endereço oficial estará online em:
                    <br />
                    <code className="text-[11px] bg-[#ECE3C8] px-2 py-0.5 font-bold text-[#28344A] block mt-1">
                      https://&lt;o-teu-utilizador&gt;.github.io/razao-xp/
                    </code>
                  </li>
                </ol>
                <div className="bg-[#3E6B4E]/10 border border-[#3E6B4E] p-2.5 text-[11px] text-[#3E6B4E] font-medium">
                  ✓ Quando abrires esse endereço no teu telemóvel Android, o Chrome instala o Razão XP como <strong>aplicação real independente</strong> e ficas com acesso para sempre!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MIGRAR DA APP ANTIGA */}
        {modalTab === 'migrate' && (
          <div className="space-y-4">
            <div className="bg-[#ECE3C8]/60 border border-[#C7B583] p-3 text-xs leading-relaxed space-y-2">
              <span className="font-mono-plex font-bold uppercase text-[10px] text-[#28344A] block">
                Como recuperar os teus dados da app anterior:
              </span>
              <p>
                <strong>Cenário A (Se usavas o GitHub Gist entre os 2 browsers):</strong>
                <br />
                Basta abrires a aba <strong>GitHub Gist</strong> ao lado, colocar o teu <em>Token</em> e o <em>ID do Gist</em> que a app antiga mostrava no topo. Os teus dados serão carregados automaticamente sem precisares de fazer mais nada!
              </p>
              <div className="border-t border-[#C7B583]/50 pt-2">
                <p>
                  <strong>Cenário B (Se os teus dados estavam guardados no browser):</strong>
                  <br />
                  1. Abre a tua app antiga no teu navegador habitual.
                  <br />
                  2. Abre a Consola de programador carregando em <kbd className="bg-white px-1 border border-gray-400">F12</kbd> (ou botão direito → <em>Inspecionar</em> → <em>Consola</em>).
                  <br />
                  3. Copia o comando abaixo e cola-o na consola:
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#FFFCF3] border border-[#C7B583] p-2 mt-1">
                <code className="text-[11px] font-mono-plex text-[#28344A] flex-1 overflow-x-auto whitespace-nowrap">
                  copy(localStorage.getItem('rx-cache'))
                </code>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="bg-[#28344A] text-[#FFFCF3] px-2.5 py-1 text-[10px] font-mono-plex uppercase hover:bg-[#3C4A65] shrink-0 inline-flex items-center gap-1"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-[#FCE082]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
                Cola aqui o JSON copiado da app antiga:
              </label>
              <textarea
                rows={4}
                placeholder='Cola aqui o texto (ex: {"totalXP": 1450, "accounts": [...], "logs": [...]})'
                value={pasteJsonText}
                onChange={(e) => setPasteJsonText(e.target.value)}
                className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-xs font-mono-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleImportPastedJson}
                className="inline-flex items-center gap-1.5 bg-[#28344A] text-[#FFFCF3] px-4 py-2 text-xs font-mono-plex uppercase tracking-wider font-semibold hover:bg-[#3C4A65] transition shadow-xs"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-[#FCE082]" />
                <span>Importar Dados para Esta Nova Versão</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GITHUB GIST */}
        {modalTab === 'gist' && (
          <div className="space-y-4">
            <p className="text-xs text-[#6E6552]">
              Ao ligar ao mesmo Gist do GitHub que usavas na app antiga, todos os teus dados anteriores são descarregados instantaneamente e mantidos sincronizados.
            </p>

            {createdGistId ? (
              <div className="bg-[#3E6B4E]/10 border border-[#3E6B4E] p-4 text-xs font-mono-plex space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#3E6B4E]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gist Criado com Sucesso!</span>
                </div>
                <p>Guarda este ID para sincronizares o teu telemóvel Android e PC:</p>
                <div className="bg-[#FFFCF3] p-2 border border-[#C7B583] select-all font-bold text-sm text-[#28344A]">
                  {createdGistId}
                </div>
                <button
                  onClick={onClose}
                  className="mt-3 w-full bg-[#28344A] text-[#FFFCF3] py-2 text-xs font-mono-plex uppercase hover:bg-[#3C4A65]"
                >
                  Concluir e Voltar ao Livro
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-3">
                <div className="bg-[#ECE3C8]/70 border border-[#C7B583] p-2.5 text-xs space-y-1">
                  <span className="font-mono-plex font-bold uppercase text-[10px] text-[#6E6552]">
                    Instruções para o token:
                  </span>
                  <p>
                    Gera um token com scope <code>gist</code> em{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#28344A] font-semibold"
                    >
                      github.com/settings/tokens
                    </a>
                    .
                  </p>
                </div>

                <div>
                  <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
                    Personal Access Token (classic, scope gist)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-xs font-mono-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
                    ID do Gist existente (o ID que a app antiga mostrava no topo)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: a1b2c3d4e5f6... (ou vazio se quiseres criar novo)"
                    value={gistInput}
                    onChange={(e) => setGistInput(e.target.value)}
                    className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-xs font-mono-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#28344A] text-[#FFFCF3] px-5 py-2 text-xs font-mono-plex uppercase tracking-wider font-semibold hover:bg-[#3C4A65] transition disabled:opacity-50"
                  >
                    {loading ? 'A Ligar...' : 'Ligar e Carregar Dados do Gist'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: BACKUP FICHEIRO LOCAL */}
        {modalTab === 'backup' && (
          <div className="space-y-4">
            <p className="text-xs text-[#6E6552]">
              Podes descarregar uma cópia completa dos teus dados em formato <code>.json</code> para guardar no telemóvel ou no computador, e restaurá-la a qualquer momento.
            </p>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => downloadJsonBackup(state)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFCF3] border border-[#C7B583] text-xs font-mono-plex font-medium text-[#28344A] hover:bg-[#ECE3C8] shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descarregar Backup (.json)</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFFCF3] border border-[#C7B583] text-xs font-mono-plex font-medium text-[#28344A] hover:bg-[#ECE3C8] cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar Ficheiro (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-4 bg-[#9B3A2C]/10 border border-[#9B3A2C] p-2.5 text-xs font-mono-plex text-[#9B3A2C]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 bg-[#3E6B4E]/10 border border-[#3E6B4E] p-2.5 text-xs font-mono-plex text-[#3E6B4E] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
