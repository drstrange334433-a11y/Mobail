import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, ShieldCheck, Clock, Download } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { canInstall, installApp } = usePwaInstall();
  const isUrdu = i18n.language?.startsWith('ur');

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="brightness-200">
              <BrandLogo showTagline={false} size="md" />
            </div>
            <p className={`text-slate-400 text-xs sm:text-sm leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
              {t('footer.about')}
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{isUrdu ? 'اصل وارنٹی اور تصدیق شدہ مصنوعات' : 'Verified Products with Warranty'}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/shop" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.shop')}
                </Link>
              </li>
              <li>
                <Link to="/new-mobiles" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.newMobiles')}
                </Link>
              </li>
              <li>
                <Link to="/used-mobiles" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.usedMobiles')}
                </Link>
              </li>
              <li>
                <Link to="/accessories" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.accessories')}
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.offers')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">
              {t('footer.customerCare')}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to="/order-history" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.orderHistory')}
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  {t('nav.admin')}
                </Link>
              </li>
              {canInstall && (
                <li>
                  <button
                    type="button"
                    onClick={installApp}
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('nav.installApp')}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">
              {t('footer.contactInfo')}
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{t('footer.location')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span dir="ltr">{t('footer.phone')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('footer.email')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>11:00 AM – 11:00 PM (PKT)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {t('brand.name')}. {t('footer.copyright')}</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-slate-400 transition-colors">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/terms" className="hover:text-slate-400 transition-colors">
              {t('footer.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
