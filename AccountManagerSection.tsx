import React, { useState } from 'react';
import { Account, AccountField, FieldType } from '../types';
import { genId, triggerHaptic } from '../services/storage';
import { Plus, Trash2, Save, X, Settings2 } from 'lucide-react';

interface AccountManagerSectionProps {
  accounts: Account[];
  onSaveAccounts: (updatedAccounts: Account[]) => void;
}

export const AccountManagerSection: React.FC<AccountManagerSectionProps> = ({
  accounts,
  onSaveAccounts,
}) => {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [openAddFieldForAcc, setOpenAddFieldForAcc] = useState<string | null>(null);

  // New field temporary form state
  const [newFieldType, setNewFieldType] = useState<FieldType>('number');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldXP, setNewFieldXP] = useState('1');

  // Keep localAccounts synced if outer accounts change
  React.useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const handleAccountNameChange = (accId: string, name: string) => {
    setLocalAccounts((prev) =>
      prev.map((a) => (a.id === accId ? { ...a, name } : a))
    );
  };

  const handleFieldChange = (
    accId: string,
    fieldId: string,
    key: keyof AccountField,
    val: any
  ) => {
    setLocalAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accId) return a;
        return {
          ...a,
          fields: a.fields.map((f) => (f.id === fieldId ? { ...f, [key]: val } : f)),
        };
      })
    );
  };

  const handleRemoveField = (accId: string, fieldId: string) => {
    triggerHaptic(20);
    setLocalAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accId) return a;
        return { ...a, fields: a.fields.filter((f) => f.id !== fieldId) };
      })
    );
  };

  const handleAddField = (accId: string) => {
    if (!newFieldLabel.trim()) return;
    const xp = parseFloat(newFieldXP) || 0;

    let newField: AccountField;
    if (newFieldType === 'number') {
      newField = {
        id: genId('f'),
        type: 'number',
        label: newFieldLabel.trim(),
        xpPerUnit: xp,
        bonusThreshold: null,
        bonusXP: 0,
      };
    } else {
      newField = {
        id: genId('f'),
        type: 'checkbox',
        label: newFieldLabel.trim(),
        xpBonus: xp,
        multiplyFieldId: null,
        multiplier: 0,
      };
    }

    setLocalAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accId) return a;
        return { ...a, fields: [...a.fields, newField] };
      })
    );

    setNewFieldLabel('');
    setNewFieldXP('1');
    setOpenAddFieldForAcc(null);
    triggerHaptic(20);
  };

  const handleSaveAccount = (accId: string) => {
    triggerHaptic(30);
    onSaveAccounts(localAccounts);
  };

  const handleDeleteAccount = (accId: string, accName: string) => {
    if (
      !confirm(
        `Eliminar a conta "${accName}"? O XP já lançado mantém-se no histórico e no total geral, mas a conta deixa de estar disponível para novos lançamentos.`
      )
    ) {
      return;
    }
    triggerHaptic(30);
    const updated = localAccounts.filter((a) => a.id !== accId);
    setLocalAccounts(updated);
    onSaveAccounts(updated);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    const newAcc: Account = {
      id: genId('acc'),
      name: newAccountName.trim(),
      total: 0,
      fields: [],
    };
    const updated = [...localAccounts, newAcc];
    setLocalAccounts(updated);
    onSaveAccounts(updated);
    setNewAccountName('');
    setShowAddAccount(false);
    triggerHaptic(25);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-spectral italic text-[#6E6552] text-xs sm:text-sm">
          Cria, edita ou elimina contas e respetivos campos de XP. Cada campo numérico pode ter bónus a partir de um valor mínimo; cada campo sim/não pode somar bónus ou multiplicar por outro campo.
        </p>

        <button
          onClick={() => {
            triggerHaptic(15);
            setShowAddAccount(!showAddAccount);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-plex tracking-wider uppercase bg-[#FFFCF3] border border-[#28344A] text-[#28344A] hover:bg-[#ECE3C8] transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddAccount ? 'Fechar' : '+ Nova Conta'}</span>
        </button>
      </div>

      {/* Create Account Form */}
      {showAddAccount && (
        <form
          onSubmit={handleCreateAccount}
          className="bg-[#ECE3C8] border-2 border-dashed border-[#C7B583] p-4 flex flex-col sm:flex-row gap-3 items-end"
        >
          <div className="w-full sm:flex-1">
            <label className="block font-mono-plex text-[10px] uppercase text-[#6E6552] mb-1">
              Nome da Nova Conta (ex: Meditação, Guitarra, Escrita...)
            </label>
            <input
              type="text"
              required
              placeholder="Nome da Conta"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="w-full bg-[#FFFCF3] border border-[#C7B583] p-2 text-sm font-sans-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#28344A] text-[#FFFCF3] px-5 py-2.5 text-xs font-mono-plex uppercase tracking-wider hover:bg-[#3C4A65] transition whitespace-nowrap"
          >
            Criar Conta
          </button>
        </form>
      )}

      {/* Account Editors */}
      <div className="space-y-4">
        {localAccounts.map((account, index) => {
          const numberFields = account.fields.filter((f) => f.type === 'number');

          return (
            <div
              key={account.id}
              className="bg-[#FFFCF3] border border-[#C7B583] p-4 sm:p-5 shadow-xs space-y-4"
            >
              {/* Account Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#C7B583]/50">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="font-mono-plex text-xs text-[#A1791F] font-bold tracking-wider uppercase">
                    Conta {String(index + 1).padStart(2, '0')}
                  </span>
                  <input
                    type="text"
                    value={account.name}
                    onChange={(e) => handleAccountNameChange(account.id, e.target.value)}
                    className="font-spectral font-semibold text-lg text-[#28344A] bg-transparent border-b border-transparent hover:border-[#C7B583] focus:border-[#28344A] focus:bg-[#F4EFE0] px-1 py-0.5 outline-hidden flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveAccount(account.id)}
                    className="inline-flex items-center gap-1 bg-[#28344A] text-[#FFFCF3] px-3 py-1.5 text-xs font-mono-plex uppercase hover:bg-[#3C4A65] transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id, account.name)}
                    className="text-[#9B3A2C] border border-[#9B3A2C]/30 hover:bg-[#9B3A2C]/10 px-2.5 py-1.5 text-xs font-mono-plex transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Fields List */}
              <div className="space-y-2">
                {account.fields.length === 0 ? (
                  <p className="font-sans-plex italic text-xs text-[#6E6552] py-2">
                    Sem campos definidos ainda — clica em "+ Adicionar Campo" abaixo.
                  </p>
                ) : (
                  account.fields.map((field) => {
                    if (field.type === 'number') {
                      return (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 flex-wrap bg-[#F4EFE0]/60 p-2.5 border border-[#C7B583]/60 text-xs font-mono-plex"
                        >
                          <span className="bg-[#ECE3C8] px-2 py-0.5 border border-[#C7B583] text-[10px] uppercase font-bold text-[#6E6552]">
                            núm
                          </span>

                          <input
                            type="text"
                            placeholder="Nome do campo"
                            value={field.label}
                            onChange={(e) =>
                              handleFieldChange(account.id, field.id, 'label', e.target.value)
                            }
                            className="w-28 sm:w-36 bg-[#FFFCF3] border border-[#C7B583] px-2 py-1 text-xs"
                          />

                          <label className="flex items-center gap-1 text-[11px] text-[#6E6552]">
                            XP/unid:
                            <input
                              type="number"
                              step="0.1"
                              value={field.xpPerUnit ?? 0}
                              onChange={(e) =>
                                handleFieldChange(
                                  account.id,
                                  field.id,
                                  'xpPerUnit',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 bg-[#FFFCF3] border border-[#C7B583] px-1.5 py-1 text-xs"
                            />
                          </label>

                          <label className="flex items-center gap-1 text-[11px] text-[#6E6552]">
                            bónus se ≥:
                            <input
                              type="number"
                              step="0.1"
                              placeholder="—"
                              value={field.bonusThreshold ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                handleFieldChange(
                                  account.id,
                                  field.id,
                                  'bonusThreshold',
                                  v === '' ? null : parseFloat(v)
                                );
                              }}
                              className="w-14 bg-[#FFFCF3] border border-[#C7B583] px-1.5 py-1 text-xs"
                            />
                          </label>

                          <label className="flex items-center gap-1 text-[11px] text-[#6E6552]">
                            +XP bónus:
                            <input
                              type="number"
                              placeholder="—"
                              value={field.bonusXP ?? ''}
                              onChange={(e) =>
                                handleFieldChange(
                                  account.id,
                                  field.id,
                                  'bonusXP',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 bg-[#FFFCF3] border border-[#C7B583] px-1.5 py-1 text-xs"
                            />
                          </label>

                          <button
                            onClick={() => handleRemoveField(account.id, field.id)}
                            className="ml-auto text-[#9B3A2C] hover:bg-[#9B3A2C]/10 p-1 transition"
                            title="Remover campo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    // Checkbox field
                    const otherNumberFields = numberFields.filter((nf) => nf.id !== field.id);

                    return (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 flex-wrap bg-[#F4EFE0]/60 p-2.5 border border-[#C7B583]/60 text-xs font-mono-plex"
                      >
                        <span className="bg-[#ECE3C8] px-2 py-0.5 border border-[#C7B583] text-[10px] uppercase font-bold text-[#6E6552]">
                          sim/não
                        </span>

                        <input
                          type="text"
                          placeholder="Nome do campo"
                          value={field.label}
                          onChange={(e) =>
                            handleFieldChange(account.id, field.id, 'label', e.target.value)
                          }
                          className="w-28 sm:w-36 bg-[#FFFCF3] border border-[#C7B583] px-2 py-1 text-xs"
                        />

                        <label className="flex items-center gap-1 text-[11px] text-[#6E6552]">
                          +XP:
                          <input
                            type="number"
                            value={field.xpBonus ?? 0}
                            onChange={(e) =>
                              handleFieldChange(
                                account.id,
                                field.id,
                                'xpBonus',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 bg-[#FFFCF3] border border-[#C7B583] px-1.5 py-1 text-xs"
                          />
                        </label>

                        <label className="flex items-center gap-1 text-[11px] text-[#6E6552]">
                          multiplicar por:
                          <select
                            value={field.multiplyFieldId || ''}
                            onChange={(e) =>
                              handleFieldChange(
                                account.id,
                                field.id,
                                'multiplyFieldId',
                                e.target.value || null
                              )
                            }
                            className="bg-[#FFFCF3] border border-[#C7B583] px-1.5 py-1 text-xs"
                          >
                            <option value="">— nenhum —</option>
                            {otherNumberFields.map((nf) => (
                              <option key={nf.id} value={nf.id}>
                                {nf.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        {field.multiplyFieldId && (
                          <label className="flex items-center gap-1 text-[11px] text-[#6E6552]">
                            ×:
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0.3"
                              value={field.multiplier ?? ''}
                              onChange={(e) =>
                                handleFieldChange(
                                  account.id,
                                  field.id,
                                  'multiplier',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-14 bg-[#FFFCF3] border border-[#C7B583] px-1.5 py-1 text-xs"
                            />
                          </label>
                        )}

                        <button
                          onClick={() => handleRemoveField(account.id, field.id)}
                          className="ml-auto text-[#9B3A2C] hover:bg-[#9B3A2C]/10 p-1 transition"
                          title="Remover campo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Field Sub-form */}
              {openAddFieldForAcc === account.id ? (
                <div className="bg-[#ECE3C8]/60 border border-dashed border-[#C7B583] p-3 flex flex-wrap items-center gap-2.5">
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                    className="bg-[#FFFCF3] border border-[#C7B583] p-1.5 text-xs font-mono-plex"
                  >
                    <option value="number">Campo Numérico</option>
                    <option value="checkbox">Sim / Não (Checkbox)</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Nome da métrica (ex: Minutos, Km, Páginas)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="bg-[#FFFCF3] border border-[#C7B583] p-1.5 text-xs font-mono-plex flex-1 min-w-[160px]"
                  />

                  <label className="flex items-center gap-1 text-xs font-mono-plex text-[#6E6552]">
                    Valor XP:
                    <input
                      type="number"
                      step="0.1"
                      value={newFieldXP}
                      onChange={(e) => setNewFieldXP(e.target.value)}
                      className="w-16 bg-[#FFFCF3] border border-[#C7B583] p-1.5 text-xs font-mono-plex"
                    />
                  </label>

                  <button
                    onClick={() => handleAddField(account.id)}
                    className="bg-[#28344A] text-[#FFFCF3] px-3 py-1.5 text-xs font-mono-plex uppercase hover:bg-[#3C4A65]"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setOpenAddFieldForAcc(null)}
                    className="text-[#6E6552] text-xs font-mono-plex px-2 py-1 hover:text-[#221F1A]"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOpenAddFieldForAcc(account.id);
                    setNewFieldLabel('');
                    setNewFieldXP('1');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-mono-plex text-[#28344A] border border-[#C7B583] px-3 py-1 hover:bg-[#ECE3C8] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Campo de Métrica</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
