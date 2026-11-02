export type FieldType = 'number' | 'checkbox';

export interface AccountField {
  id: string;
  type: FieldType;
  label: string;
  xpPerUnit?: number;
  bonusThreshold?: number | null;
  bonusXP?: number;
  xpBonus?: number;
  multiplyFieldId?: string | null;
  multiplier?: number;
}

export interface Account {
  id: string;
  name: string;
  total: number;
  fields: AccountField[];
}

export interface Reward {
  id: string;
  name: string;
  costEUR?: number | null;
  xpRequired: number;
  xpEarned: number;
  completed: boolean;
}

export interface JournalLog {
  id: string;
  date: string;
  accountName: string;
  desc: string;
  xp: number;
  appliedTo: string;
}

export interface AppState {
  totalXP: number;
  accounts: Account[];
  rewards: Reward[];
  logs: JournalLog[];
  hardMode: boolean;
}

export type SyncStatus = 'idle' | 'busy' | 'ok' | 'err';
