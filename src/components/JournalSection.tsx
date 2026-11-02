import React, { useState } from 'react';
import { JournalLog } from '../types';
import { fmt, downloadLogsCsv, triggerHaptic } from '../services/storage';
import { Search, BookOpen, Download, FileSpreadsheet } from 'lucide-react';

interface JournalSectionProps {
  logs: JournalLog[];
}

export const JournalSection: React.FC<JournalSectionProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.accountName.toLowerCase().includes(q) ||
      l.desc.toLowerCase().includes(q) ||
      l.appliedTo.toLowerCase().includes(q) ||
      l.date.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    triggerHaptic(25);
    setIsExporting(true);
    try {
      downloadLogsCsv(logs);
    } finally {
      setTimeout(() => setIsExporting(false), 1200);
    }
  };

  return (
    <div className="bg-[#FFFCF3] border border-[#C7B583] p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono-plex text-xs text-[#6E6552]">
            Total de registos: <strong className="text-[#28344A]">{logs.length}</strong>
          </span>

          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            title={logs.length === 0 ? 'Sem lançamentos no histórico para exportar' : 'Exportar histórico de lançamentos para CSV (Excel / Folhas de Cálculo)'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-plex uppercase tracking-wider font-semibold bg-[#28344A] text-[#FFFCF3] hover:bg-[#3C4A65] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-[#C7B583] transition shadow-xs cursor-pointer rounded-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#FCE082]" />
            <span>{isExporting ? 'A Descarregar...' : 'Exportar CSV'}</span>
          </button>
        </div>

        {logs.length > 5 && (
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6E6552]" />
            <input
              type="text"
              placeholder="Pesquisar diário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-[#F4EFE0] border border-[#C7B583] text-xs font-mono-plex text-[#221F1A] focus:border-[#28344A] focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="w-8 h-8 text-[#6E6552] mx-auto mb-2 opacity-40" />
          <p className="font-spectral italic text-[#6E6552] text-sm">
            Ainda sem lançamentos registados. Regista a tua primeira sessão acima!
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono-plex text-[#6E6552] italic">
          Nenhum registo encontrado para "{search}".
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono-plex text-xs">
            <thead>
              <tr className="border-b border-[#C7B583] text-[#6E6552] text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2.5 font-semibold">Data</th>
                <th className="text-left py-2 px-2.5 font-semibold">Conta</th>
                <th className="text-left py-2 px-2.5 font-semibold">Descrição</th>
                <th className="text-right py-2 px-2.5 font-semibold">Crédito</th>
                <th className="text-left py-2 px-2.5 font-semibold hidden md:table-cell">Aplicado a</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[#D9CCA3]/60 hover:bg-[#ECE3C8]/40 transition"
                >
                  <td className="py-2.5 px-2.5 text-[#6E6552] whitespace-nowrap text-[11px]">
                    {log.date}
                  </td>
                  <td className="py-2.5 px-2.5 font-semibold text-[#28344A] whitespace-nowrap">
                    {log.accountName}
                  </td>
                  <td className="py-2.5 px-2.5 text-[#221F1A]">
                    <div>{log.desc}</div>
                    <div className="text-[10px] text-[#A1791F] md:hidden mt-0.5">
                      → {log.appliedTo}
                    </div>
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-bold text-[#3E6B4E] whitespace-nowrap">
                    +{fmt(log.xp)}
                  </td>
                  <td className="py-2.5 px-2.5 text-[#6E6552] hidden md:table-cell truncate max-w-[180px]">
                    {log.appliedTo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
