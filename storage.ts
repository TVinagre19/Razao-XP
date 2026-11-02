import { AppState, Account, SyncStatus, JournalLog } from '../types';
export type { AppState, SyncStatus, Account, JournalLog };


export const LS_TOKEN = 'rx-gh-token';
export const LS_GIST = 'rx-gh-gist';
export const LS_CACHE = 'rx-cache';
export const LS_OFFLINE_MODE = 'rx-offline-only';
export const GIST_FILENAME = 'razao-xp-data.json';
export const HARD_MODE_MULTIPLIER = 0.6;

export function genId(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function defaultAccounts(): Account[] {
  return [
    {
      id: genId('acc'),
      name: 'Leitura',
      total: 0,
      fields: [
        { id: 'f_pages', type: 'number', label: 'Páginas', xpPerUnit: 1, bonusThreshold: null, bonusXP: 0 },
        { id: 'f_minutes', type: 'number', label: 'Minutos', xpPerUnit: 1, bonusThreshold: null, bonusXP: 0 },
        { id: 'f_finished', type: 'checkbox', label: 'terminei o livro', xpBonus: 200, multiplyFieldId: 'f_pages', multiplier: 0.3 }
      ]
    },
    {
      id: genId('acc'),
      name: 'Corrida',
      total: 0,
      fields: [
        { id: 'f_km', type: 'number', label: 'Km', xpPerUnit: 10, bonusThreshold: 5, bonusXP: 30 },
        { id: 'f_minutes', type: 'number', label: 'Minutos', xpPerUnit: 4, bonusThreshold: null, bonusXP: 0 }
      ]
    },
    {
      id: genId('acc'),
      name: 'Treino de Força',
      total: 0,
      fields: [
        { id: 'f_minutes', type: 'number', label: 'Minutos', xpPerUnit: 8, bonusThreshold: 45, bonusXP: 25 }
      ]
    },
    {
      id: genId('acc'),
      name: 'Estudos (Python/Data)',
      total: 0,
      fields: [
        { id: 'f_minutes', type: 'number', label: 'Minutos', xpPerUnit: 2, bonusThreshold: null, bonusXP: 0 },
        { id: 'f_exercises', type: 'number', label: 'Exercícios', xpPerUnit: 15, bonusThreshold: null, bonusXP: 0 },
        { id: 'f_module', type: 'checkbox', label: 'terminei módulo/projeto', xpBonus: 300, multiplyFieldId: null, multiplier: 0 }
      ]
    }
  ];
}

export function defaultState(): AppState {
  return {
    totalXP: 0,
    accounts: defaultAccounts(),
    rewards: [
      { id: genId('r'), name: "(exemplo) The Emperor's New Mind — Penrose", costEUR: 15, xpRequired: 1525, xpEarned: 0, completed: false },
      { id: genId('r'), name: '(exemplo) Fim de semana fora', costEUR: 150, xpRequired: 15025, xpEarned: 0, completed: false }
    ],
    logs: [],
    hardMode: false
  };
}

export function safeMerge(loaded: any): AppState {
  const base = defaultState();
  if (!loaded || typeof loaded !== 'object') return base;
  return {
    totalXP: typeof loaded.totalXP === 'number' ? loaded.totalXP : base.totalXP,
    accounts: Array.isArray(loaded.accounts) && loaded.accounts.length > 0 ? loaded.accounts : base.accounts,
    rewards: Array.isArray(loaded.rewards) ? loaded.rewards : base.rewards,
    logs: Array.isArray(loaded.logs) ? loaded.logs : base.logs,
    hardMode: typeof loaded.hardMode === 'boolean' ? loaded.hardMode : base.hardMode
  };
}

export function ghHeaders(token: string) {
  return {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
}

export async function createGist(token: string, initialState: AppState): Promise<string> {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({
      description: 'Razão XP — dados pessoais',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(initialState, null, 2)
        }
      }
    })
  });
  if (!res.ok) {
    throw new Error('Falha ao criar gist (código ' + res.status + ')');
  }
  const json = await res.json();
  return json.id;
}

export async function fetchGistState(token: string, gistId: string): Promise<AppState> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: ghHeaders(token)
  });
  if (!res.ok) {
    throw new Error('Falha ao ler gist (código ' + res.status + ')');
  }
  const json = await res.json();
  const file = json.files && json.files[GIST_FILENAME];
  if (!file) {
    throw new Error('Ficheiro de dados não encontrado no gist.');
  }
  return JSON.parse(file.content);
}

export async function pushGistState(token: string, gistId: string, state: AppState): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: ghHeaders(token),
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(state, null, 2)
        }
      }
    })
  });
  if (!res.ok) {
    throw new Error('Falha ao guardar no GitHub Gist (código ' + res.status + ')');
  }
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('pt-PT');
}

export function computeLevel(totalXP: number): { level: number; into: number; span: number } {
  let level = 1;
  let remaining = totalXP;
  let needed = 250;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = level * 250;
  }
  return { level, into: remaining, span: needed };
}

export function triggerHaptic(duration = 25) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignored if device does not support vibration
    }
  }
}

export function downloadJsonBackup(state: AppState) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `razao-xp-backup-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function downloadLogsCsv(logs: JournalLog[]) {
  if (!logs || logs.length === 0) return;

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    if (s.includes('"') || s.includes(',') || s.includes(';') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headers = ['ID', 'Data', 'Conta', 'Descrição', 'Crédito XP', 'Aplicado a'];
  const rows = logs.map((l) => [
    escapeCsv(l.id),
    escapeCsv(l.date),
    escapeCsv(l.accountName),
    escapeCsv(l.desc),
    escapeCsv(l.xp),
    escapeCsv(l.appliedTo),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `razao-xp-diario-${dateStr}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

