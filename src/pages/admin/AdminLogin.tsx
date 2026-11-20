import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck,
  Eye,
  EyeOff 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AdminLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session, isAdmin, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUrdu = i18n.language?.startsWith('ur');
  const fromLocation = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin/dashboard';

  // If already authenticated and authorized as admin, redirect to dashboard immediately
  useEffect(() => {
    if (!authLoading && session && isAdmin) {
      navigate(fromLocation, { replace: true });
    }
  }, [session, isAdmin, authLoading, navigate, fromLocation]);

  useEffect(() => {
    if ((location.state as { unauthorized?: boolean })?.unauthorized) {
      setErrorMsg(t('auth.unauthorized'));
    }
  }, [location.state, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, create an admin user in Supabase Authentication, then sign in.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const { error, isAdmin: loginIsAdmin } = await signIn(email.trim(), password);
      setIsSubmitting(false);

      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setErrorMsg(t('auth.invalidCredentials'));
        } else {
          setErrorMsg(error.message || 'Authentication failed. Please verify your credentials.');
        }
      } else if (loginIsAdmin === false) {
        setErrorMsg('Access denied. Your account is not registered in the administrative users list.');
      } else {
        navigate(fromLocation, { replace: true });
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'A network error occurred while connecting to Supabase.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.backToHome')}</span>
        </Link>
        <LanguageSwitcher variant="compact" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-block brightness-200 mb-2">
            <BrandLogo size="lg" showTagline={false} />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-4">
            {t('admin.loginTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t('admin.loginSubtitle')}
          </p>
        </div>

        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Live Supabase Environment Pending
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Connect your real Supabase instance by setting <code className="bg-amber-900/50 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-900/50 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                {t('admin.emailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@parachamobile.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                {t('admin.passwordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('admin.signingIn')}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span className={isUrdu ? 'font-urdu' : ''}>{t('admin.signInButton')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/80 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Protected by Supabase Authentication & Row Level Security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
