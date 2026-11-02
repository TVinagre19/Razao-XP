import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 flex items-center gap-2.5 bg-[#9B3A2C] text-[#FFFCF3] px-3.5 py-2 shadow-xl border border-[#ECE3C8]/40 font-mono-plex text-xs rounded-sm animate-bounce-once">
      <WifiOff className="w-4 h-4 text-[#FCE082] shrink-0" />
      <span>Modo Offline — Lançamentos guardados no telemóvel</span>
    </div>
  );
};
