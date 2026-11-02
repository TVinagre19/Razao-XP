import React from 'react';
import { PenTool, Layers, BookOpen, Award, Settings2, BookMarked } from 'lucide-react';
import { triggerHaptic } from '../services/storage';

export type TabKey = 'entry' | 'accounts' | 'journal' | 'treasury' | 'manage' | 'all';

interface NavigationTabsProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  entryCount: number;
  rewardCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentTab,
  onTabChange,
  rewardCount,
}) => {
  const tabs = [
    { key: 'entry' as TabKey, label: 'Lançar', icon: PenTool },
    { key: 'accounts' as TabKey, label: 'Contas', icon: Layers },
    { key: 'journal' as TabKey, label: 'Diário', icon: BookOpen },
    {
      key: 'treasury' as TabKey,
      label: 'Tesouro',
      icon: Award,
      badge: rewardCount > 0 ? rewardCount : undefined,
    },
    { key: 'manage' as TabKey, label: 'Gerir', icon: Settings2 },
    { key: 'all' as TabKey, label: 'Livro Inteiro', icon: BookMarked },
  ];

  return (
    <nav className="sticky top-0 z-30 bg-[#EFE8D4]/95 backdrop-blur-xs py-2 border-b border-[#C7B583] -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                triggerHaptic(15);
                onTabChange(tab.key);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-plex tracking-wider uppercase whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-[#28344A] text-[#FFFCF3] border-[#28344A] shadow-xs'
                  : 'bg-[#FFFCF3]/80 text-[#6E6552] border-[#C7B583] hover:bg-[#ECE3C8] hover:text-[#28344A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isActive ? 'bg-[#A1791F] text-white' : 'bg-[#ECE3C8] text-[#28344A]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
