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
  Tag, 
  Image as ImageIcon 
} from 'lucide-react';
import type { BrandFormData } from '../../types/brand';
import type { Brand } from '../../types/database';
import { brandAdminService } from '../../services/brandAdminService';

interface BrandFormProps {
  initialData?: Brand | null;
  isEditMode?: boolean;
}

export const BrandForm: React.FC<BrandFormProps> = ({ initialData, isEditMode = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  // Form State
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    logo_url: null,
    is_active: true,
    sort_order: 0,
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Form submission and validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        name: initialData.name || '',
        logo_url: initialData.logo_url || null,
        is_active: initialData.is_active ?? true,
        sort_order: initialData.sort_order ?? 0,
      });

      if (initialData.logo_url) {
        setLogoPreview(initialData.logo_url);
      }
    }
  }, [initialData, isEditMode]);

  // Handle logo file selection with validation
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate format
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validFormats.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        logo: 'Please upload a PNG, JPG, WEBP, or SVG image.',
      }));
      return;
    }

    // Validate size (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo: 'Logo image must be smaller than 8MB.',
      }));
      return;
    }

    setErrors((prev) => {
      const rest = { ...prev };
      delete rest.logo;
      return rest;
    });

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    setFormData((prev) => ({ ...prev, logo_url: null }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cleanName = formData.name.trim();
    if (!cleanName) {
      newErrors.name = t('brands.form.required');
    } else if (cleanName.length > 100) {
      newErrors.name = t('brands.form.nameMaxLength');
    }

    if (formData.sort_order < 0 || isNaN(formData.sort_order)) {
      newErrors.sort_order = t('brands.form.sortNonNegative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && initialData) {
        const res = await brandAdminService.updateBrand(
          initialData.id,
          formData,
          logoFile,
          removeLogo
        );
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await brandAdminService.createBrand(
          formData,
          logoFile
        );
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/admin/brands');
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while saving the brand.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/admin/brands"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          <span>{t('brands.form.backToList')}</span>
        </Link>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isEditMode ? t('brands.editBrand') : t('brands.addBrand')}
        </h1>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error saving brand: </span>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>{t('brands.saveSuccess')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Information Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t('brands.form.basicInfo')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('brands.form.name')} <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('brands.form.namePlaceholder')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="sort_order" className="block text-xs font-bold text-slate-700">
                  {t('brands.form.sortOrder')}
                </label>
                <span className="text-[11px] text-slate-400">
                  {t('brands.form.sortOrderHelp')}
                </span>
              </div>
              <input
                id="sort_order"
                type="number"
                min="0"
                step="1"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border font-mono ${
                  errors.sort_order ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.sort_order && (
                <p className="text-[11px] text-red-600 mt-1">{errors.sort_order}</p>
              )}
            </div>
          </div>
        </div>

        {/* Brand Logo Card (Supabase Storage: brand-logos) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('brands.form.logo')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload official logo image to storage bucket <code className="font-semibold text-indigo-700">brand-logos</code>. Supports PNG, JPG, WEBP, SVG (max 5MB).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Preview Box */}
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Brand logo preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-400" />
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>{logoPreview ? t('brands.form.changeLogo') : t('brands.form.uploadLogo')}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('brands.form.removeLogo')}</span>
                  </button>
                )}
              </div>

              {errors.logo && (
                <p className="text-[11px] text-red-600 mt-1">{errors.logo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Toggle Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t('brands.form.isActive')}
              </span>
              <span className="text-[11px] text-slate-500">
                Active brands are selectable when creating new products. Inactive brands remain linked to existing catalog products.
              </span>
            </div>
          </label>
        </div>

        {/* Submit / Cancel Footer */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Link
            to="/admin/brands"
            className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {t('brands.form.cancel')}
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('brands.form.saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('brands.form.save')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
