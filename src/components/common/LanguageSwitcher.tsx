import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'full' }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ur') ? 'ur' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(nextLang);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLanguage}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
        aria-label="Switch Language"
        title={currentLang === 'en' ? 'Switch to Urdu (اردو)' : 'انگریزی میں تبدیل کریں'}
      >
        <Globe className="w-3.5 h-3.5 text-blue-600" />
        <span className={currentLang === 'ur' ? 'font-urdu font-medium text-sm' : ''}>
          {currentLang === 'en' ? 'اردو' : 'EN'}
        </span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-xs">
      <button
        type="button"
        onClick={() => i18n.changeLanguage('en')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
          currentLang === 'en'
            ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/50'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('ur')}
        className={`px-3 py-1.5 text-xs font-semibold font-urdu rounded-lg transition-all ${
          currentLang === 'ur'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        اردو
      </button>
    </div>
  );
};
