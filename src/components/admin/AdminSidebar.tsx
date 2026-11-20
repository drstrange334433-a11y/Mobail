import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Smartphone,
  FolderTree,
  Tag,
  ImageIcon,
  UploadCloud,
  Sparkles,
  Percent,
  ShoppingBag,
  Star,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { to: '/admin/products', icon: Smartphone, label: t('admin.products') },
    { to: '/admin/bulk-images', icon: UploadCloud, label: isUrdu ? 'بلک امیج اپلوڈ' : 'Bulk Image Upload' },
    { to: '/admin/image-prompts', icon: Sparkles, label: isUrdu ? 'امیج پرامپٹس گائیڈ' : 'AI Image Prompts' },
    { to: '/admin/categories', icon: FolderTree, label: t('admin.categories') },
    { to: '/admin/brands', icon: Tag, label: t('admin.brands') },
    { to: '/admin/banners', icon: ImageIcon, label: t('admin.banners') },
    { to: '/admin/orders', icon: ShoppingBag, label: t('admin.orders') },
    { to: '/admin/testimonials', icon: Star, label: t('admin.testimonials') },
    { to: '/admin/offers', icon: Percent, label: t('admin.offers'), badge: 'Phase 2' },
    { to: '/admin/settings', icon: Settings, label: t('admin.settings'), badge: 'Phase 2' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 z-50 w-72 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen
            ? 'translate-x-0'
            : isUrdu
            ? 'translate-x-full'
            : '-translate-x-full'
        }`}
      >
        {/* Brand header in sidebar */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="brightness-200">
            <BrandLogo size="sm" showTagline={false} />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store portal status */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-blue-400">
              Admin Portal
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <span>View Store</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={isUrdu ? 'font-urdu' : ''}>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-300">{t('brand.name')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Phase 1 Foundation • v1.0.0</p>
        </div>
      </aside>
    </>
  );
};
