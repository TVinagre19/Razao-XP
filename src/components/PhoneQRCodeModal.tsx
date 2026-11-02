import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, X, Copy, Check, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../services/storage';

interface PhoneQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneQRCodeModal: React.FC<PhoneQRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (isOpen && appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#28344A',
          light: '#FFFDF7',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    triggerHaptic(20);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#F4EFE0] border-2 border-[#28344A] shadow-2xl p-6 relative font-sans-plex text-[#221F1A] text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6E6552] hover:text-[#9B3A2C] transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-[#28344A] text-[#FCE082] flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Smartphone className="w-5 h-5" />
        </div>

        <h3 className="font-spectral-sc font-bold text-xl text-[#28344A] mb-1">
          Abrir no Telemóvel Android
        </h3>
        <p className="text-xs text-[#6E6552] mb-4">
          Não precisas de abrir esta conversa no telemóvel. Basta apontar a câmara para o código abaixo:
        </p>

        {qrDataUrl ? (
          <div className="inline-block p-2 bg-[#FFFDF7] border-2 border-[#C7B583] shadow-md mb-4">
            <img src={qrDataUrl} alt="QR Code para abrir no telemóvel" className="w-52 h-52 block mx-auto" />
          </div>
        ) : (
          <div className="w-52 h-52 mx-auto flex items-center justify-center bg-[#ECE3C8] text-xs font-mono-plex">
            A gerar QR code...
          </div>
        )}

        <div className="bg-[#ECE3C8]/70 border border-[#C7B583] p-2.5 text-xs text-left font-mono-plex mb-4 space-y-1">
          <span className="font-bold text-[#28344A] block">Depois de abrir no Chrome do telemóvel:</span>
          <p className="text-[11px] text-[#6E6552]">
            Toca no botão dourado <strong>"Instalar no Android"</strong> no topo da página.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={appUrl}
            className="flex-1 bg-[#FFFDF7] border border-[#C7B583] px-2 py-1.5 text-xs font-mono-plex text-[#6E6552] select-all truncate"
          />
          <button
            onClick={handleCopy}
            className="bg-[#28344A] text-[#FFFCF3] px-3 py-1.5 text-xs font-mono-plex uppercase hover:bg-[#3C4A65] shrink-0 inline-flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#FCE082]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
