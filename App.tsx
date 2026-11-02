import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Account, Reward, JournalLog, SyncStatus } from './types';
import {
  LS_TOKEN,
  LS_GIST,
  LS_CACHE,
  defaultState,
  safeMerge,
  fetchGistState,
  pushGistState,
  createGist,
  genId,
  fmt,
  triggerHaptic,
} from './services/storage';
import { Header } from './components/Header';
import { NavigationTabs, TabKey } from './components/NavigationTabs';
import { NewEntrySection } from './components/NewEntrySection';
import { AccountsSection } from './components/AccountsSection';
import { JournalSection } from './components/JournalSection';
import { TreasurySection } from './components/TreasurySection';
import { AccountManagerSection } from './components/AccountManagerSection';
import { SyncModal } from './components/SyncModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PhoneQRCodeModal } from './components/PhoneQRCodeModal';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(LS_TOKEN) || '');
  const [gistId, setGistId] = useState<string>(() => localStorage.getItem(LS_GIST) || '');
  const [state, setState] = useState<AppState>(() => {
    const cached = localStorage.getItem(LS_CACHE);
    if (cached) {
      try {
        return safeMerge(JSON.parse(cached));
      } catch (e) {
        console.error('Failed to parse cached state', e);
      }
    }
    return defaultState();
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMsg, setSyncMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('entry');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Initial boot: fetch from Gist if token and gistId exist
  useEffect(() => {
    if (!token || !gistId) return;

    let isMounted = true;
    const loadGist = async () => {
      setSyncStatus('busy');
      try {
        const remoteState = await fetchGistState(token, gistId);
        if (isMounted) {
          const merged = safeMerge(remoteState);
          setState(merged);
          localStorage.setItem(LS_CACHE, JSON.stringify(merged));
          setSyncStatus('ok');
          setSyncMsg(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err: any) {
        if (isMounted) {
          setSyncStatus('err');
          setSyncMsg('offline — a usar cópia local');
          console.warn('Gist fetch failed, using local cache:', err);
        }
      }
    };

    loadGist();
    return () => {
      isMounted = false;
    };
  }, [token, gistId]);

  // Persist state to LocalStorage and push to Gist if connected
  const persistState = useCallback(
    async (nextState: AppState) => {
      localStorage.setItem(LS_CACHE, JSON.stringify(nextState));

      if (token && gistId) {
        setSyncStatus('busy');
        try {
          await pushGistState(token, gistId, nextState);
          setSyncStatus('ok');
          setSyncMsg(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
          setSyncStatus('err');
          setSyncMsg('não foi possível sincronizar — vê a ligação');
          console.error('Failed to push to Gist:', err);
        }
      }
    },
    [token, gistId]
  );

  // Manual Sync trigger
  const handleManualSync = async () => {
    if (!token || !gistId) {
      setIsSyncModalOpen(true);
      return;
    }
    setSyncStatus('busy');
    try {
      const remoteState = await fetchGistState(token, gistId);
      const merged = safeMerge(remoteState);
      setState(merged);
      localStorage.setItem(LS_CACHE, JSON.stringify(merged));
      setSyncStatus('ok');
      setSyncMsg(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
      triggerHaptic(25);
    } catch (err: any) {
      setSyncStatus('err');
      setSyncMsg(err.message || 'erro ao sincronizar');
    }
  };

  // Disconnect Gist
  const handleDisconnectGist = () => {
    if (
      !confirm(
        'Isto desliga este dispositivo do Gist (os teus dados continuam guardados no GitHub e no telemóvel). Deseja continuar?'
      )
    ) {
      return;
    }
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_GIST);
    setToken('');
    setGistId('');
    setSyncStatus('idle');
    setSyncMsg('');
    triggerHaptic(20);
  };

  // Connect or create Gist
  const handleConnectGist = async (newToken: string, newGistId?: string): Promise<string | void> => {
    let resolvedGistId = newGistId;
    let loadedState = state;

    if (resolvedGistId) {
      const remote = await fetchGistState(newToken, resolvedGistId);
      loadedState = safeMerge(remote);
    } else {
      resolvedGistId = await createGist(newToken, state);
    }

    localStorage.setItem(LS_TOKEN, newToken);
    localStorage.setItem(LS_GIST, resolvedGistId);
    localStorage.setItem(LS_CACHE, JSON.stringify(loadedState));

    setToken(newToken);
    setGistId(resolvedGistId);
    setState(loadedState);
    setSyncStatus('ok');
    setSyncMsg(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));

    return newGistId ? undefined : resolvedGistId;
  };

  // Log Entry handler
  const handleLogEntry = async (
    accountId: string,
    values: Record<string, any>
  ): Promise<{ xp: number; rewardName?: string } | null> => {
    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) return null;

    let xp = 0;
    const parts: string[] = [];

    account.fields.forEach((f) => {
      if (f.type === 'number') {
        const v = parseFloat(values[f.id]) || 0;
        xp += v * (Number(f.xpPerUnit) || 0);
        if (
          f.bonusThreshold !== null &&
          f.bonusThreshold !== undefined &&
          f.bonusThreshold !== ('' as any) &&
          v >= Number(f.bonusThreshold)
        ) {
          xp += Number(f.bonusXP) || 0;
        }
        if (v > 0) parts.push(`${v} ${f.label.toLowerCase()}`);
      } else if (f.type === 'checkbox') {
        if (values[f.id]) {
          let b = Number(f.xpBonus) || 0;
          if (f.multiplyFieldId) {
            const mv = parseFloat(values[f.multiplyFieldId]) || 0;
            b += mv * (Number(f.multiplier) || 0);
          }
          xp += b;
          parts.push(f.label);
        }
      }
    });

    if (state.hardMode) {
      xp = xp * 0.6;
    }
    const finalXP = Math.round(xp);
    if (finalXP <= 0) return null;

    const desc = parts.length ? parts.join(' · ') : '—';

    // Pick random active reward
    const activeRewards = state.rewards.filter((r) => !r.completed);
    let appliedLabel = '—';
    const nextRewards = [...state.rewards];

    if (activeRewards.length > 0) {
      const chosen = activeRewards[Math.floor(Math.random() * activeRewards.length)];
      const rIndex = nextRewards.findIndex((r) => r.id === chosen.id);
      if (rIndex !== -1) {
        const newEarned = Math.min(nextRewards[rIndex].xpRequired, nextRewards[rIndex].xpEarned + finalXP);
        const isDone = newEarned >= nextRewards[rIndex].xpRequired;
        nextRewards[rIndex] = {
          ...nextRewards[rIndex],
          xpEarned: newEarned,
          completed: isDone,
        };
        appliedLabel = nextRewards[rIndex].name;
      }
    }

    const nextAccounts = state.accounts.map((a) =>
      a.id === accountId ? { ...a, total: (a.total || 0) + finalXP } : a
    );

    const nowStr = new Date().toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newLog: JournalLog = {
      id: genId('l'),
      date: nowStr,
      accountName: account.name,
      desc,
      xp: finalXP,
      appliedTo: appliedLabel,
    };

    const nextLogs = [newLog, ...state.logs];
    if (nextLogs.length > 80) nextLogs.length = 80;

    const nextState: AppState = {
      ...state,
      totalXP: state.totalXP + finalXP,
      accounts: nextAccounts,
      rewards: nextRewards,
      logs: nextLogs,
    };

    setState(nextState);
    await persistState(nextState);

    return { xp: finalXP, rewardName: appliedLabel !== '—' ? appliedLabel : undefined };
  };

  // Add reward
  const handleAddReward = async (name: string, costEUR?: number, directXP?: number) => {
    let xpRequired: number;
    let finalCostEUR: number | null = null;

    if (directXP && directXP > 0) {
      xpRequired = Math.round(directXP);
    } else if (costEUR && costEUR > 0) {
      finalCostEUR = costEUR;
      xpRequired = Math.round(25 + costEUR * 100);
    } else {
      xpRequired = 500;
    }

    const newReward: Reward = {
      id: genId('r'),
      name,
      costEUR: finalCostEUR,
      xpRequired,
      xpEarned: 0,
      completed: false,
    };

    const nextState: AppState = {
      ...state,
      rewards: [...state.rewards, newReward],
    };
    setState(nextState);
    await persistState(nextState);
  };

  // Remove reward
  const handleRemoveReward = async (id: string) => {
    const nextState: AppState = {
      ...state,
      rewards: state.rewards.filter((r) => r.id !== id),
    };
    setState(nextState);
    await persistState(nextState);
  };

  // Toggle hard mode
  const handleToggleHardMode = async (checked: boolean) => {
    const nextState: AppState = {
      ...state,
      hardMode: checked,
    };
    setState(nextState);
    await persistState(nextState);
  };

  // Save accounts from manager
  const handleSaveAccounts = async (updatedAccounts: Account[]) => {
    const nextState: AppState = {
      ...state,
      accounts: updatedAccounts,
    };
    setState(nextState);
    await persistState(nextState);
  };

  // Reset all
  const handleResetAll = async () => {
    if (
      !confirm(
        'Isto apaga todo o progresso atual do Razão XP (no Gist e no telemóvel). Tens a certeza absoluta?'
      )
    ) {
      return;
    }
    triggerHaptic(40);
    const fresh = defaultState();
    setState(fresh);
    await persistState(fresh);
  };

  // Import backup JSON
  const handleImportBackup = async (imported: AppState) => {
    const merged = safeMerge(imported);
    setState(merged);
    await persistState(merged);
  };

  return (
    <div className="min-h-screen bg-[#EFE8D4] text-[#221F1A] font-sans-plex pb-12 selection:bg-[#D4AF37]/30">
      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main Container */}
      <div className="max-w-(--breakpoint-lg) mx-auto p-3 sm:p-6 lg:p-8">
        <main className="ledger-paper ledger-margin-line p-5 sm:p-8 md:p-10 shadow-2xl space-y-6">
          {/* Header */}
          <Header
            state={state}
            syncStatus={syncStatus}
            syncMsg={syncMsg}
            gistId={gistId}
            token={token}
            onToggleHardMode={handleToggleHardMode}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onDisconnectGist={handleDisconnectGist}
            onManualSync={handleManualSync}
            onOpenQrModal={() => setIsQrModalOpen(true)}
          />

          {/* Navigation Bar / Tabs */}
          <NavigationTabs
            currentTab={activeTab}
            onTabChange={setActiveTab}
            entryCount={state.logs.length}
            rewardCount={state.rewards.filter((r) => !r.completed).length}
          />

          {/* Tab Content Rendering */}
          <div className="pt-2 space-y-8">
            {/* 1. Lançar (New Entry) */}
            {(activeTab === 'entry' || activeTab === 'all') && (
              <section aria-labelledby="section-entry">
                <h2
                  id="section-entry"
                  className="font-spectral font-semibold text-xs uppercase tracking-widest text-[#6E6552] border-b border-[#C7B583] pb-2 mb-4"
                >
                  Novo Lançamento
                </h2>
                <NewEntrySection
                  accounts={state.accounts}
                  rewards={state.rewards}
                  hardMode={state.hardMode}
                  onLogEntry={handleLogEntry}
                  onGoToAccounts={() => setActiveTab('manage')}
                />
              </section>
            )}

            {/* 2. Contas (Accounts Grid) */}
            {(activeTab === 'accounts' || activeTab === 'all') && (
              <section aria-labelledby="section-accounts">
                <h2
                  id="section-accounts"
                  className="font-spectral font-semibold text-xs uppercase tracking-widest text-[#6E6552] border-b border-[#C7B583] pb-2 mb-4"
                >
                  Contas do Livro
                </h2>
                <AccountsSection
                  accounts={state.accounts}
                  onSelectAccountForEntry={(accId) => {
                    setActiveTab('entry');
                  }}
                  onGoToManager={() => setActiveTab('manage')}
                />
              </section>
            )}

            {/* 3. Diário de Lançamentos */}
            {(activeTab === 'journal' || activeTab === 'all') && (
              <section aria-labelledby="section-journal">
                <h2
                  id="section-journal"
                  className="font-spectral font-semibold text-xs uppercase tracking-widest text-[#6E6552] border-b border-[#C7B583] pb-2 mb-4"
                >
                  Diário de Lançamentos
                </h2>
                <JournalSection logs={state.logs} />
              </section>
            )}

            {/* 4. Tesouro (Rewards) */}
            {(activeTab === 'treasury' || activeTab === 'all') && (
              <section aria-labelledby="section-treasury">
                <h2
                  id="section-treasury"
                  className="font-spectral font-semibold text-xs uppercase tracking-widest text-[#6E6552] border-b border-[#C7B583] pb-2 mb-4"
                >
                  Tesouro & Metas
                </h2>
                <TreasurySection
                  rewards={state.rewards}
                  onAddReward={handleAddReward}
                  onRemoveReward={handleRemoveReward}
                />
              </section>
            )}

            {/* 5. Gerir Contas */}
            {(activeTab === 'manage' || activeTab === 'all') && (
              <section aria-labelledby="section-manage">
                <h2
                  id="section-manage"
                  className="font-spectral font-semibold text-xs uppercase tracking-widest text-[#6E6552] border-b border-[#C7B583] pb-2 mb-4"
                >
                  Gerir Contas & Métricas
                </h2>
                <AccountManagerSection
                  accounts={state.accounts}
                  onSaveAccounts={handleSaveAccounts}
                />
              </section>
            )}
          </div>

          {/* Footer Bar */}
          <footer className="pt-8 border-t border-[#C7B583] flex items-center justify-between flex-wrap gap-3 text-xs font-mono-plex text-[#6E6552]">
            <div className="flex items-center gap-2">
              <span>Razão XP PWA</span>
              <span>·</span>
              <span>{token && gistId ? 'Guardado no GitHub Gist' : 'Guardado no Telemóvel'}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="hover:text-[#28344A] underline cursor-pointer"
              >
                Definições Gist
              </button>
              <button
                onClick={handleResetAll}
                className="text-[#9B3A2C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>reiniciar livro</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Sync / Settings Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        token={token}
        gistId={gistId}
        state={state}
        onConnect={handleConnectGist}
        onImportBackup={handleImportBackup}
      />

      {/* QR Code Modal for Phone */}
      <PhoneQRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Offline Toast */}
      <OfflineIndicator />
    </div>
  );
}
