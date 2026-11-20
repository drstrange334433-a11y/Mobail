import React from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  linkToHome?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  showTagline = true,
  size = 'md',
  linkToHome = true,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  const content = (
    <div className="flex items-center gap-3 group">
      {/* Icon Emblem */}
      <div className="relative flex items-center justify-center bg-linear-to-br from-blue-700 to-blue-900 text-white rounded-2xl p-2.5 shadow-md shadow-blue-900/10 transition-transform group-hover:scale-105">
        <Smartphone className={`${size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-blue-100`} />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full ring-2 ring-white"></span>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`font-black tracking-tight text-slate-900 ${
          isUrdu ? 'font-urdu text-lg leading-tight' : size === 'lg' ? 'text-2xl font-extrabold' : size === 'sm' ? 'text-base font-bold' : 'text-xl'
        }`}>
          {t('brand.name')}
        </span>
        {showTagline && (
          <span className={`text-slate-500 font-medium ${
            isUrdu ? 'font-urdu text-xs text-blue-700' : 'text-[11px] tracking-wide text-slate-500 uppercase'
          }`}>
            {t('brand.tagline')}
          </span>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
};
