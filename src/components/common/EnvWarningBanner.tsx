import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const EnvWarningBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isSupabaseConfigured) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside aria-label="Database Setup Alert" className="bg-amber-500/10 border-b border-amber-300/60 text-amber-900 text-xs px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold text-amber-950">
            {t('common.envWarningTitle')}:
          </span>
          <span className="text-amber-800">
            {t('common.envWarningMessage')}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2"
          >
            <span>{isOpen ? 'Hide Instructions' : 'Setup Guide'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto mt-3 p-4 bg-amber-100/80 rounded-xl border border-amber-200 text-amber-950">
          <h4 className="font-bold text-sm mb-1">How to connect Supabase:</h4>
          <ol className="list-decimal list-inside space-y-1 text-xs text-amber-900">
            <li>Create or open your project at <strong>https://supabase.com</strong></li>
            <li>In Supabase Dashboard, go to <strong>Project Settings → API</strong></li>
            <li>Copy your <strong>Project URL</strong> and <strong>anon / public key</strong></li>
            <li>Set them in your environment / <code className="bg-amber-200/80 px-1 py-0.5 rounded">.env</code>:</li>
          </ol>
          <div className="mt-2 relative">
            <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
              {`VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co\nVITE_SUPABASE_ANON_KEY=<your-anon-key>`}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium flex items-center gap-1 border border-slate-700"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-amber-800">
            Also execute the SQL migration located at <code className="font-semibold">supabase/migrations/20261007_init_paracha_schema.sql</code> in the Supabase SQL Editor.
          </p>
        </div>
      )}
    </aside>
  );
};
