import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Star, 
  Loader2, 
  AlertCircle, 
  Check, 
  MessageSquare,
  User,
  Eye
} from 'lucide-react';
import type { TestimonialFormData } from '../../types/testimonial';
import type { Testimonial } from '../../types/database';
import { testimonialAdminService } from '../../services/testimonialAdminService';

interface TestimonialFormProps {
  initialData?: Testimonial | null;
  isEditMode?: boolean;
}

export const TestimonialForm: React.FC<TestimonialFormProps> = ({ 
  initialData, 
  isEditMode = false 
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  // Form State
  const [formData, setFormData] = useState<TestimonialFormData>({
    customer_name: '',
    review_en: '',
    review_ur: '',
    rating: 5,
    is_active: true,
  });

  // Validation & status state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        customer_name: initialData.customer_name || '',
        review_en: initialData.review_en || '',
        review_ur: initialData.review_ur || '',
        rating: initialData.rating || 5,
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData, isEditMode]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = formData.customer_name.trim();
    if (!trimmedName) {
      newErrors.customer_name = t('testimonials.form.customerNameRequired');
    } else if (trimmedName.length > 100) {
      newErrors.customer_name = t('testimonials.form.customerNameTooLong');
    }

    const trimmedEn = formData.review_en.trim();
    if (!trimmedEn) {
      newErrors.review_en = t('testimonials.form.reviewEnRequired');
    } else if (trimmedEn.length > 1000) {
      newErrors.review_en = t('testimonials.form.reviewEnTooLong');
    }

    const trimmedUr = formData.review_ur.trim();
    if (trimmedUr && trimmedUr.length > 1000) {
      newErrors.review_ur = t('testimonials.form.reviewUrTooLong');
    }

    const ratingVal = Number(formData.rating);
    if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      newErrors.rating = t('testimonials.form.ratingInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && initialData) {
        const res = await testimonialAdminService.updateTestimonial(initialData.id, formData);
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await testimonialAdminService.createTestimonial(formData);
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/admin/testimonials');
      }, 700);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while saving.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            to="/admin/testimonials"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <BackIcon className="w-3.5 h-3.5" />
            <span>{t('testimonials.form.backToList')}</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditMode ? t('testimonials.editTestimonial') : t('testimonials.addTestimonial')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEditMode
              ? `Editing testimonial record #${initialData?.id?.slice(0, 8)}`
              : 'Add customer feedback that will be displayed on the storefront hero and reviews section'}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Error: </strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('testimonials.saveSuccess')}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Rating Section */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t('testimonials.form.basicInfo')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('testimonials.form.customerName')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => {
                  setFormData({ ...formData, customer_name: e.target.value });
                  if (errors.customer_name) {
                    setErrors({ ...errors, customer_name: '' });
                  }
                }}
                placeholder={t('testimonials.form.customerNamePlaceholder')}
                className={`w-full text-xs p-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.customer_name
                    ? 'border-rose-300 focus:ring-rose-400'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.customer_name && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.customer_name}</p>
              )}
            </div>

            {/* Rating Stars Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('testimonials.form.rating')} <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isSelected = formData.rating >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: starVal })}
                      className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                      title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          isSelected
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-black text-amber-600 ml-2">
                  {formData.rating} / 5
                </span>
              </div>
              {errors.rating && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.rating}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bilingual Review Feedback Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Section */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                EN
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {t('testimonials.form.englishSection')}
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('testimonials.form.reviewEn')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={formData.review_en}
                onChange={(e) => {
                  setFormData({ ...formData, review_en: e.target.value });
                  if (errors.review_en) setErrors({ ...errors, review_en: '' });
                }}
                placeholder={t('testimonials.form.reviewEnPlaceholder')}
                className={`w-full text-xs p-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                  errors.review_en ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.review_en && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.review_en}</p>
              )}
            </div>
          </div>

          {/* Urdu Section */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4" dir="rtl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                اردو
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {t('testimonials.form.urduSection')}
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('testimonials.form.reviewUr')} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
              </label>
              <textarea
                rows={5}
                dir="rtl"
                value={formData.review_ur}
                onChange={(e) => {
                  setFormData({ ...formData, review_ur: e.target.value });
                  if (errors.review_ur) setErrors({ ...errors, review_ur: '' });
                }}
                placeholder={t('testimonials.form.reviewUrPlaceholder')}
                className={`w-full text-xs p-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-sans leading-relaxed ${
                  errors.review_ur ? 'border-rose-300 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'
                }`}
              />
              {errors.review_ur && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.review_ur}</p>
              )}
            </div>
          </div>
        </div>

        {/* Visibility / Active Setting Section */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Eye className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t('testimonials.form.settings')}
            </h2>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mt-1 w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {t('testimonials.form.isActive')}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {t('testimonials.form.isActiveHelp')}
              </span>
            </div>
          </label>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/admin/testimonials"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            {t('testimonials.form.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('testimonials.form.saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t('testimonials.form.save')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
