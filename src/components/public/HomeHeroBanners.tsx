import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import type { Banner } from '../../types/database';

interface HomeHeroBannersProps {
  banners: Banner[];
}

export const HomeHeroBanners: React.FC<HomeHeroBannersProps> = ({ banners }) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');
  const ArrowIcon = isUrdu ? ArrowLeft : ArrowRight;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 6 seconds if multiple banners and not paused
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  // Handle manual navigation
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex] || banners[0];
  const title = isUrdu ? currentBanner.title_ur || currentBanner.title_en : currentBanner.title_en;
  const subtitle = isUrdu ? currentBanner.subtitle_ur || currentBanner.subtitle_en : currentBanner.subtitle_en;
  const buttonText = isUrdu ? currentBanner.button_text_ur || currentBanner.button_text_en : currentBanner.button_text_en;
  const buttonLink = currentBanner.button_link || '/shop';

  return (
    <section 
      className="relative overflow-hidden bg-slate-950 text-white min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] flex items-center border-b border-blue-900/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Banner Image with smooth opacity transition */}
      <div className="absolute inset-0 z-0">
        <img
          key={currentBanner.id}
          src={currentBanner.image_url}
          alt={title}
          className="w-full h-full object-cover object-center transform transition-transform duration-1000 scale-105"
        />
        {/* Cinematic multi-gradient overlays for maximum readability & aesthetic richness */}
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-950/75 to-transparent sm:w-3/4 lg:w-3/5 z-1" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent z-1" />
        <div className="absolute inset-0 bg-blue-950/30 mix-blend-overlay z-1" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-16 sm:py-20">
        <div className="max-w-2xl space-y-6 animate-fade-in" key={currentBanner.id}>
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/25 text-blue-200 border border-blue-400/40 backdrop-blur-md shadow-lg shadow-blue-900/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>{t('brand.tagline')}</span>
            {banners.length > 1 && (
              <span className="ml-1 pl-2 border-l border-blue-400/30 font-mono text-[11px] text-blue-300">
                {currentIndex + 1} / {banners.length}
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white drop-shadow-md ${isUrdu ? 'font-urdu' : ''}`}>
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className={`text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl drop-shadow-xs ${isUrdu ? 'font-urdu' : ''}`}>
              {subtitle}
            </p>
          )}

          {/* Action Button & Catalog Shortcut */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {buttonText && buttonLink && (
              buttonLink.startsWith('http') ? (
                <a
                  href={buttonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <span>{buttonText}</span>
                  <ArrowIcon className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  to={buttonLink}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <span>{buttonText}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
              )
            )}

            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-md transition-all focus:outline-none"
            >
              <ShoppingBag className="w-4 h-4 text-blue-300" />
              <span>{t('home.exploreCatalog')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next controls for multiple banners */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous banner"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next banner"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex 
                    ? 'w-6 h-2 bg-blue-500' 
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
