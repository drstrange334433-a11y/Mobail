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
  FolderTree, 
  Link as LinkIcon, 
  Image as ImageIcon 
} from 'lucide-react';
import type { CategoryFormData } from '../../types/category';
import type { Category } from '../../types/database';
import { categoryAdminService } from '../../services/categoryAdminService';

interface CategoryFormProps {
  initialData?: Category | null;
  isEditMode?: boolean;
}

// Helper to convert English name into URL-safe slug
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars except space and hyphen
    .replace(/[\s_-]+/g, '-') // collapse whitespace and underscores into single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
};

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, isEditMode = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  // Potential Parent Categories
  const [parentOptions, setParentOptions] = useState<Category[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);

  // Form State
  const [formData, setFormData] = useState<CategoryFormData>({
    name_en: '',
    name_ur: '',
    slug: '',
    parent_id: null,
    icon_url: null,
    is_active: true,
    sort_order: 0,
  });

  // Track if user has manually edited the slug
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Icon upload state
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);

  // Form states & validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load parent categories (excluding current category in edit mode)
  useEffect(() => {
    let isMounted = true;
    async function loadParents() {
      try {
        const res = await categoryAdminService.getPotentialParents(
          isEditMode && initialData ? initialData.id : undefined
        );
        if (isMounted) {
          setParentOptions(res.data || []);
          setLoadingParents(false);
        }
      } catch {
        if (isMounted) setLoadingParents(false);
      }
    }
    loadParents();
    return () => {
      isMounted = false;
    };
  }, [isEditMode, initialData]);

  // Populate form in edit mode
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        name_en: initialData.name_en || '',
        name_ur: initialData.name_ur || '',
        slug: initialData.slug || '',
        parent_id: initialData.parent_id || null,
        icon_url: initialData.icon_url || null,
        is_active: initialData.is_active ?? true,
        sort_order: initialData.sort_order ?? 0,
      });
      setSlugManuallyEdited(true); // Don't auto-overwrite existing slug

      if (initialData.icon_url) {
        setIconPreview(initialData.icon_url);
      }
    }
  }, [initialData, isEditMode]);

  // Name English change with automated slug generation
  const handleNameEnChange = (val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, name_en: val };
      if (!slugManuallyEdited) {
        updated.slug = generateSlug(val);
      }
      return updated;
    });
  };

  // Manual slug change
  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      slug: val.toLowerCase().replace(/\s+/g, '-'),
    }));
  };

  // Handle icon file selection
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      setErrors((prev) => ({
        ...prev,
        icon: 'Please upload a PNG, JPG, WEBP, or SVG image.',
      }));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        icon: 'Icon image must be smaller than 8MB.',
      }));
      return;
    }

    setErrors((prev) => {
      const rest = { ...prev };
      delete rest.icon;
      return rest;
    });

    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setRemoveIcon(false);
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setRemoveIcon(true);
    setFormData((prev) => ({ ...prev, icon_url: null }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_en.trim()) {
      newErrors.name_en = t('categories.form.required');
    }

    const cleanSlug = formData.slug.trim().toLowerCase();
    if (!cleanSlug) {
      newErrors.slug = t('categories.form.required');
    } else if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      newErrors.slug = t('categories.form.slugInvalid');
    }

    if (formData.sort_order < 0 || isNaN(formData.sort_order)) {
      newErrors.sort_order = t('categories.form.sortNonNegative');
    }

    if (isEditMode && initialData && formData.parent_id === initialData.id) {
      newErrors.parent_id = 'A category cannot select itself as its own parent.';
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
        const res = await categoryAdminService.updateCategory(
          initialData.id,
          formData,
          iconFile,
          removeIcon
        );
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await categoryAdminService.createCategory(
          formData,
          iconFile
        );
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/admin/categories');
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while saving the category.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/admin/categories"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          <span>{t('categories.form.backToList')}</span>
        </Link>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isEditMode ? t('categories.editCategory') : t('categories.addCategory')}
        </h1>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error saving category: </span>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>{t('categories.saveSuccess')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Information */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t('categories.form.basicInfo')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name English */}
            <div>
              <label htmlFor="name_en" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('categories.form.nameEn')} <span className="text-red-500">*</span>
              </label>
              <input
                id="name_en"
                type="text"
                value={formData.name_en}
                onChange={(e) => handleNameEnChange(e.target.value)}
                placeholder="e.g. Smart Watches"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.name_en ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.name_en && (
                <p className="text-[11px] text-red-600 mt-1">{errors.name_en}</p>
              )}
            </div>

            {/* Name Urdu */}
            <div>
              <label htmlFor="name_ur" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('categories.form.nameUr')}
              </label>
              <input
                id="name_ur"
                type="text"
                dir="rtl"
                value={formData.name_ur}
                onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                placeholder="مثلاً: اسمارٹ واچز"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-urdu text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="slug" className="block text-xs font-bold text-slate-700">
                {t('categories.form.slug')} <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {t('categories.form.slugHelp')}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="smart-watches"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border font-mono ${
                  errors.slug ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            {errors.slug && (
              <p className="text-[11px] text-red-600 mt-1">{errors.slug}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parent Category */}
            <div>
              <label htmlFor="parent_id" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('categories.form.parentCategory')}
              </label>
              <select
                id="parent_id"
                value={formData.parent_id || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parent_id: e.target.value ? e.target.value : null,
                  })
                }
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.parent_id ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">{t('categories.form.none')}</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isUrdu ? cat.name_ur : cat.name_en}
                  </option>
                ))}
              </select>
              {errors.parent_id && (
                <p className="text-[11px] text-red-600 mt-1">{errors.parent_id}</p>
              )}
            </div>

            {/* Sort Order */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="sort_order" className="block text-xs font-bold text-slate-700">
                  {t('categories.form.sortOrder')}
                </label>
                <span className="text-[11px] text-slate-400">
                  {t('categories.form.sortOrderHelp')}
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

        {/* Category Icon (Supabase Storage: category-icons) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('categories.form.icon')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload icon graphic to storage bucket <code className="font-semibold text-indigo-700">category-icons</code>.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Preview Box */}
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              {iconPreview ? (
                <img
                  src={iconPreview}
                  alt="Category icon preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                <Upload className="w-4 h-4" />
                <span>{iconPreview ? t('categories.form.changeIcon') : t('categories.form.uploadIcon')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  className="hidden"
                />
              </label>

              {iconPreview && (
                <button
                  type="button"
                  onClick={handleRemoveIcon}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('categories.form.removeIcon')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Toggle */}
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
                {t('categories.form.isActive')}
              </span>
              <span className="text-[11px] text-slate-500">
                Inactive categories are hidden from customers and will not be available when adding new products.
              </span>
            </div>
          </label>
        </div>

        {/* Submit / Cancel Footer */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Link
            to="/admin/categories"
            className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {t('categories.form.cancel')}
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('categories.form.saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('categories.form.save')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
