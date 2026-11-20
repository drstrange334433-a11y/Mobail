import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Check, 
  ImageIcon,
  Link as LinkIcon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { BannerFormData } from '../../types/banner';
import type { Banner } from '../../types/database';
import { bannerAdminService } from '../../services/bannerAdminService';

interface BannerFormProps {
  initialData?: Banner | null;
  isEditMode?: boolean;
}

export const BannerForm: React.FC<BannerFormProps> = ({ initialData, isEditMode = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  // Form State
  const [formData, setFormData] = useState<BannerFormData>({
    title_en: '',
    title_ur: '',
    subtitle_en: '',
    subtitle_ur: '',
    button_text_en: '',
    button_text_ur: '',
    button_link: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });

  // Image upload & preview state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customUrlMode, setCustomUrlMode] = useState(false);

  // Form submission and validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        title_en: initialData.title_en || '',
        title_ur: initialData.title_ur || '',
        subtitle_en: initialData.subtitle_en || '',
        subtitle_ur: initialData.subtitle_ur || '',
        button_text_en: initialData.button_text_en || '',
        button_text_ur: initialData.button_text_ur || '',
        button_link: initialData.button_link || '',
        image_url: initialData.image_url || '',
        sort_order: initialData.sort_order ?? 0,
        is_active: initialData.is_active ?? true,
      });

      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData, isEditMode]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate format
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        image: 'Please upload a PNG, JPG, or WEBP image.',
      }));
      return;
    }

    // Validate size (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: 'Banner image must be smaller than 8MB.',
      }));
      return;
    }

    setErrors((prev) => {
      const rest = { ...prev };
      delete rest.image;
      return rest;
    });

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  // Client-side validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.title_en.trim()) {
      errs.title_en = t('banners.form.required');
    } else if (formData.title_en.trim().length > 150) {
      errs.title_en = t('banners.form.titleMaxLength');
    }

    if (!formData.title_ur.trim()) {
      errs.title_ur = t('banners.form.required');
    } else if (formData.title_ur.trim().length > 150) {
      errs.title_ur = t('banners.form.titleMaxLength');
    }

    if (formData.subtitle_en && formData.subtitle_en.trim().length > 250) {
      errs.subtitle_en = t('banners.form.subtitleMaxLength');
    }

    if (formData.subtitle_ur && formData.subtitle_ur.trim().length > 250) {
      errs.subtitle_ur = t('banners.form.subtitleMaxLength');
    }

    if (formData.button_text_en && formData.button_text_en.trim().length > 50) {
      errs.button_text_en = t('banners.form.buttonTextMaxLength');
    }

    if (formData.button_text_ur && formData.button_text_ur.trim().length > 50) {
      errs.button_text_ur = t('banners.form.buttonTextMaxLength');
    }

    if (Number(formData.sort_order) < 0) {
      errs.sort_order = t('banners.form.sortNonNegative');
    }

    // Ensure image is provided either as file or URL
    if (!imageFile && !formData.image_url?.trim() && !imagePreview) {
      errs.image = t('banners.form.imageRequired');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && initialData?.id) {
        const res = await bannerAdminService.updateBanner(
          initialData.id,
          formData,
          imageFile
        );

        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await bannerAdminService.createBanner(
          formData,
          imageFile
        );

        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/admin/banners');
      }, 700);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred saving banner.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/admin/banners"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <BackIcon className="w-3.5 h-3.5" />
            <span>{t('banners.form.backToList')}</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? t('banners.editBanner') : t('banners.addBanner')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('banners.subtitle')}
          </p>
        </div>
      </div>

      {/* Global Submit Error Banner */}
      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900">Unable to save banner</h4>
            <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Global Submit Success Banner */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{t('banners.saveSuccess')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: English Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              {t('banners.form.englishSection')}
            </h2>
            <span className="text-[11px] font-medium text-slate-400">EN</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.titleEn')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, title_en: e.target.value }))}
                placeholder={t('banners.form.titleEnPlaceholder')}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.title_en ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.title_en && (
                <p className="text-xs text-rose-600 mt-1">{errors.title_en}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.subtitleEn')}
              </label>
              <input
                type="text"
                value={formData.subtitle_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle_en: e.target.value }))}
                placeholder={t('banners.form.subtitleEnPlaceholder')}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.subtitle_en ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errors.subtitle_en && (
                <p className="text-xs text-rose-600 mt-1">{errors.subtitle_en}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.buttonTextEn')}
              </label>
              <input
                type="text"
                value={formData.button_text_en}
                onChange={(e) => setFormData((prev) => ({ ...prev, button_text_en: e.target.value }))}
                placeholder={t('banners.form.buttonTextEnPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {errors.button_text_en && (
                <p className="text-xs text-rose-600 mt-1">{errors.button_text_en}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Urdu Content (اردو مواد) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 font-urdu">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {t('banners.form.urduSection')}
            </h2>
            <span className="text-[11px] font-medium text-slate-400">UR</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.titleUr')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                dir="rtl"
                value={formData.title_ur}
                onChange={(e) => setFormData((prev) => ({ ...prev, title_ur: e.target.value }))}
                placeholder={t('banners.form.titleUrPlaceholder')}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl font-urdu focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.title_ur ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.title_ur && (
                <p className="text-xs text-rose-600 mt-1">{errors.title_ur}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.subtitleUr')}
              </label>
              <input
                type="text"
                dir="rtl"
                value={formData.subtitle_ur}
                onChange={(e) => setFormData((prev) => ({ ...prev, subtitle_ur: e.target.value }))}
                placeholder={t('banners.form.subtitleUrPlaceholder')}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl font-urdu focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.subtitle_ur ? 'border-rose-300 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.subtitle_ur && (
                <p className="text-xs text-rose-600 mt-1">{errors.subtitle_ur}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.buttonTextUr')}
              </label>
              <input
                type="text"
                dir="rtl"
                value={formData.button_text_ur}
                onChange={(e) => setFormData((prev) => ({ ...prev, button_text_ur: e.target.value }))}
                placeholder={t('banners.form.buttonTextUrPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-urdu focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {errors.button_text_ur && (
                <p className="text-xs text-rose-600 mt-1">{errors.button_text_ur}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Action Link */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-purple-600" />
              {t('banners.form.actionSection')}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('banners.form.buttonLink')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.button_link}
                onChange={(e) => setFormData((prev) => ({ ...prev, button_link: e.target.value }))}
                placeholder={t('banners.form.buttonLinkPlaceholder')}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
              />
              <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Relative site route (e.g. <code>/shop</code>, <code>/shop?condition=new</code>) or external URL.
            </p>
          </div>
        </div>

        {/* SECTION 4: Media / Banner Image */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              {t('banners.form.mediaSection')} <span className="text-rose-500">*</span>
            </h2>
            <button
              type="button"
              onClick={() => setCustomUrlMode(!customUrlMode)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {customUrlMode ? 'Upload from device' : 'Enter image URL directly'}
            </button>
          </div>

          {/* Image Preview Box */}
          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative aspect-21/9 sm:aspect-16/6 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                <img
                  src={imagePreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="cursor-pointer px-3.5 py-2 bg-white text-slate-900 font-medium text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('banners.form.changeImage')}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3.5 py-2 bg-rose-600 text-white font-medium text-xs rounded-xl shadow-lg hover:bg-rose-700 transition-all inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('banners.form.removeImage')}</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center justify-between">
                <span>{imageFile ? `${imageFile.name} (${Math.round(imageFile.size / 1024)} KB)` : 'Current saved image'}</span>
                <span className="text-emerald-600 font-medium">Ready for deployment</span>
              </p>
            </div>
          ) : customUrlMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.imageUrlOrDirect')}
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, image_url: val }));
                  if (val.startsWith('http://') || val.startsWith('https://')) {
                    setImagePreview(val);
                  }
                }}
                placeholder={t('banners.form.imageUrlPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
              <label className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {t('banners.form.uploadImage')}
                </span>
                <span className="text-xs text-slate-500 mt-1 max-w-sm">
                  {t('banners.form.imageHelp')}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {errors.image && (
            <p className="text-xs text-rose-600 mt-1">{errors.image}</p>
          )}
        </div>

        {/* SECTION 5: Display Settings (Sort Order & Status) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              {t('banners.form.settingsSection')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('banners.form.sortOrder')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {t('banners.form.sortOrderHelp')}
              </p>
              {errors.sort_order && (
                <p className="text-xs text-rose-600 mt-1">{errors.sort_order}</p>
              )}
            </div>

            <div className="pt-2 sm:pt-0">
              <label className="relative flex items-start gap-3 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {t('banners.form.isActive')}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {t('banners.form.isActiveHelp')}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/admin/banners"
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
          >
            {t('banners.form.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('banners.form.saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('banners.form.save')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
