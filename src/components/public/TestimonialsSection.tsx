import React, { useEffect, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Quote, 
  ShieldCheck, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import type { Testimonial } from '../../types/testimonial';
import { testimonialService } from '../../services/testimonialService';

export const TestimonialsSection: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    async function loadTestimonials() {
      try {
        setLoading(true);
        setError(null);
        const { data, error: err } = await testimonialService.getActiveTestimonials();
        if (!isMounted) return;
        if (err) {
          setError(err.message);
        } else {
          setTestimonials(data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching testimonials');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTestimonials();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keyboard navigation for active testimonial carousel
  const handlePrev = () => {
    if (testimonials.length <= 1) return;
    startTransition(() => {
      setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    });
  };

  const handleNext = () => {
    if (testimonials.length <= 1) return;
    startTransition(() => {
      setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    });
  };

  // If loading, show tasteful lightweight skeleton that does not block page
  if (loading) {
    return (
      <section className="py-12 bg-slate-50 border-t border-slate-200/60" aria-label={t('testimonials.title')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center py-8">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">{t('testimonials.loading')}</p>
        </div>
      </section>
    );
  }

  // Graceful empty state or error handling without breaking homepage layout
  if (error || testimonials.length === 0) {
    // If empty or error, don't show broken UI or fake cards.
    return null;
  }

  const currentTestimonial = testimonials[activeIndex] || testimonials[0];
  const total = testimonials.length;

  return (
    <section 
      className="py-16 sm:py-20 bg-linear-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200/70 relative overflow-hidden"
      aria-label={t('testimonials.title')}
    >
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('testimonials.homepage.sectionBadge')}</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight ${isUrdu ? 'font-urdu' : ''}`}>
            {t('testimonials.homepage.sectionTitle')}
          </h2>
          <p className={`mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto ${isUrdu ? 'font-urdu' : ''}`}>
            {t('testimonials.homepage.sectionSubtitle')}
          </p>
        </div>

        {/* Testimonials Display */}
        {total === 1 ? (
          /* Single Testimonial Card */
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 relative">
            <Quote className="absolute top-6 right-6 sm:top-8 sm:right-8 w-12 h-12 text-blue-100 -scale-x-100" />
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center ring-4 ring-blue-50 shadow-md shrink-0 uppercase">
                {currentTestimonial.customer_name ? currentTestimonial.customer_name.charAt(0) : 'U'}
              </div>
              <div className="text-center sm:text-left flex-1 space-y-3">
                <div className="flex items-center justify-center sm:justify-start gap-1" aria-label={`Rating: ${currentTestimonial.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= currentTestimonial.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-700">({currentTestimonial.rating}/5)</span>
                </div>
                <p className={`text-slate-700 text-base sm:text-lg leading-relaxed italic ${isUrdu ? 'font-urdu text-right not-italic' : ''}`}>
                  "{isUrdu ? (currentTestimonial.review_ur || currentTestimonial.review_en) : (currentTestimonial.review_en || currentTestimonial.review_ur)}"
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{currentTestimonial.customer_name}</h4>
                    <p className="text-xs text-slate-500">Verified Buyer</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Review
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Carousel & Grid for Multiple Testimonials */
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 relative min-h-[260px] flex flex-col justify-between">
              <Quote className="absolute top-6 right-6 sm:top-8 sm:right-8 w-14 h-14 text-blue-100 -scale-x-100" />
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center ring-4 ring-blue-50 shadow-md shrink-0 uppercase">
                  {currentTestimonial.customer_name ? currentTestimonial.customer_name.charAt(0) : 'U'}
                </div>
                
                <div className="text-center sm:text-left flex-1 space-y-3">
                  <div className="flex items-center justify-center sm:justify-start gap-1" aria-label={`Rating: ${currentTestimonial.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= currentTestimonial.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs font-bold text-slate-700">({currentTestimonial.rating}/5)</span>
                  </div>

                  <p className={`text-slate-700 text-base sm:text-lg lg:text-xl leading-relaxed italic ${isUrdu ? 'font-urdu text-right not-italic' : ''}`}>
                    "{isUrdu ? (currentTestimonial.review_ur || currentTestimonial.review_en) : (currentTestimonial.review_en || currentTestimonial.review_ur)}"
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base sm:text-lg">{currentTestimonial.customer_name}</h4>
                      <p className="text-xs text-slate-500">Verified Customer</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Review
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Testimonial slides">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={activeIndex === idx}
                      aria-label={`Testimonial ${idx + 1}`}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        activeIndex === idx ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Arrow Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={isUrdu ? handleNext : handlePrev}
                    aria-label={t('testimonials.prev')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={isUrdu ? handlePrev : handleNext}
                    aria-label={t('testimonials.next')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
