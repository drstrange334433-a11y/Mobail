import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut, UserCircle2, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { user, signOut, isConfigured } = useAuth();
  const isUrdu = i18n.language?.startsWith('ur');

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Left side: mobile toggle + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              {t('admin.title')}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {t('admin.subtitle')}
          </p>
        </div>
      </div>

      {/* Right side: Database status pill + user info + lang switcher + logout */}
      <div className="flex items-center gap-3">
        {/* Supabase Connection Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-slate-50">
          <Database className={`w-3.5 h-3.5 ${isConfigured ? 'text-emerald-600' : 'text-amber-500'}`} />
          <span className={isConfigured ? 'text-emerald-800' : 'text-amber-700'}>
            {isConfigured ? t('admin.dbConnected') : t('admin.dbDisconnected')}
          </span>
          <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher variant="compact" />

        {/* User Session Info */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {user?.email?.charAt(0).toUpperCase() || <UserCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
              {user?.email || 'Admin User'}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
              Admin
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          title="Sign out of Admin"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className={isUrdu ? 'font-urdu' : ''}>{t('admin.signOut')}</span>
        </button>
      </div>
    </header>
  );
};
