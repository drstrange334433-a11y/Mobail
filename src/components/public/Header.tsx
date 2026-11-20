import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  X, 
  ShoppingBag, 
  Phone, 
  ShieldCheck, 
  User, 
  Search,
  Package,
  Download
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { EnvWarningBanner } from '../common/EnvWarningBanner';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canInstall, installApp } = usePwaInstall();
  const isUrdu = i18n.language?.startsWith('ur');

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/shop', label: t('nav.shop') },
    { to: '/new-mobiles', label: t('nav.newMobiles') },
    { to: '/used-mobiles', label: t('nav.usedMobiles') },
    { to: '/accessories', label: t('nav.accessories') },
    { to: '/offers', label: t('nav.offers') },
    { to: '/order-history', label: t('nav.orderHistory') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <EnvWarningBanner />

      {/* Top utility bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-blue-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isUrdu ? '100% تصدیق شدہ اور پی ٹی اے منظور شدہ فونز' : '100% Authentic & PTA Approved Devices'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span dir="ltr">+92 300 1234567</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/order-history"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
              title={t('nav.trackOrder')}
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('nav.trackOrder')}</span>
            </Link>
            <span className="text-slate-700">·</span>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              title="Admin Portal"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('nav.admin')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <div className="shrink-0">
            <BrandLogo />
          </div>

          {/* Desktop Search / Quick Action */}
          <div className="hidden lg:flex flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('common.search')}
                disabled
                className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 placeholder:text-slate-400 cursor-not-allowed opacity-80"
                title="Catalog Search (Phase 3)"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Controls: Language, Cart & Install */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            {canInstall && (
              <button
                type="button"
                onClick={installApp}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all"
                title={t('nav.installApp')}
                aria-label={t('nav.installApp')}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.installApp')}</span>
              </button>
            )}

            <LanguageSwitcher />

            {/* Customer Profile / Order History */}
            <Link
              to="/order-history"
              className="p-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
              title={t('nav.orderHistory')}
              aria-label={t('nav.orderHistory')}
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Icon (Foundation) */}
            <Link
              to="/cart"
              className="relative p-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="lg:hidden p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop category links */}
        <nav className="hidden lg:flex items-center gap-1 py-2.5 border-t border-slate-100 overflow-x-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Mobile Install App Button */}
          {canInstall && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  installApp();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{t('nav.installApp')}</span>
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 p-2"
            >
              <User className="w-4 h-4" />
              <span>{t('nav.admin')}</span>
            </Link>
            <div className="text-xs text-slate-500 font-mono" dir="ltr">
              +92 300 1234567
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
