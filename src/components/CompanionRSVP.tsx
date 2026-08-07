import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Guest } from '../types';
import StandaloneRSVP from './StandaloneRSVP';

interface CompanionRSVPProps {
  hash: string;
  onClose: () => void;
  onSuccess: (guest: Guest) => void;
}

export default function CompanionRSVP({ hash, onClose, onSuccess }: CompanionRSVPProps) {
  const [limit, setLimit] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/companion-links/' + encodeURIComponent(hash))
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Link de acompanhantes inv\u00e1lido.');
        return data;
      })
      .then(data => {
        if (active) setLimit(data.acompanhantes_limite);
      })
      .catch(requestError => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [hash]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-watercolor px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/75 p-8 text-center shadow-2xl backdrop-blur-md">
          <AlertCircle size={42} className="mx-auto mb-4 text-red-500" />
          <h1 className="font-serif text-2xl font-bold text-gold-900">Link indispon&#237;vel</h1>
          <p className="mt-3 text-sm text-gold-700">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white"
          >
            <ArrowLeft size={14} />
            Voltar ao convite
          </button>
        </div>
      </div>
    );
  }

  if (limit === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-watercolor">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <StandaloneRSVP
      onClose={onClose}
      onSuccess={onSuccess}
      companionHash={hash}
      companionLimit={limit}
    />
  );
}
