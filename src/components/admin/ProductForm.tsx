import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  Trash2, 
  Star, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Check, 
  Smartphone, 
  DollarSign, 
  ShieldCheck, 
  Layers,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { 
  AdminProductDetail, 
  ProductFormData, 
  ImageUploadItem, 
  VariantItem 
} from '../../types/product';
import type { Category, Brand } from '../../types/database';
import { productAdminService } from '../../services/productAdminService';
import { normalizeImageUrl } from '../../utils/productImages';
import { resizeAndConvertToWebP } from '../../utils/imageProcessor';

interface ProductFormProps {
  initialData?: AdminProductDetail | null;
  isEditMode?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, isEditMode = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  // Categories & Brands fetched from real Supabase database
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form Field State
  const [formData, setFormData] = useState<ProductFormData>({
    name_en: '',
    name_ur: '',
    description_en: '',
    description_ur: '',
    category_id: '',
    brand_id: '',
    condition: 'new',
    price: 0,
    sale_price: null,
    stock_qty: 0,
    pta_status: 'PTA Approved',
    battery_health: '',
    warranty_status: '',
    accessories_included: '',
    is_active: true,
    is_featured: false,
    installment_available: false,
  });

  // Images State
  const [images, setImages] = useState<ImageUploadItem[]>([]);

  // Variants State
  const [variants, setVariants] = useState<VariantItem[]>([]);

  // Form status & validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load Categories & Brands
  useEffect(() => {
    let isMounted = true;
    async function loadLookups() {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          productAdminService.getCategories(),
          productAdminService.getBrands(initialData?.brand_id || undefined),
        ]);
        if (isMounted) {
          setCategories(catsRes.data || []);
          setBrands(brandsRes.data || []);
          setLoadingLookups(false);
        }
      } catch {
        if (isMounted) setLoadingLookups(false);
      }
    }
    loadLookups();
    return () => {
      isMounted = false;
    };
  }, []);

  // Populate data in edit mode
  useEffect(() => {
    if (initialData && isEditMode) {
      setFormData({
        name_en: initialData.name_en || '',
        name_ur: initialData.name_ur || '',
        description_en: initialData.description_en || '',
        description_ur: initialData.description_ur || '',
        category_id: initialData.category_id || '',
        brand_id: initialData.brand_id || '',
        condition: initialData.condition || 'new',
        price: initialData.price || 0,
        sale_price: initialData.sale_price !== null && initialData.sale_price !== undefined ? initialData.sale_price : null,
        stock_qty: initialData.stock_qty || 0,
        pta_status: initialData.pta_status || 'PTA Approved',
        battery_health: initialData.battery_health || '',
        warranty_status: initialData.warranty_status || '',
        accessories_included: initialData.accessories_included || '',
        is_active: initialData.is_active ?? true,
        is_featured: initialData.is_featured ?? false,
        installment_available: initialData.installment_available ?? false,
      });

      // Existing images
      if (initialData.product_images && initialData.product_images.length > 0) {
        setImages(
          initialData.product_images.map((img, idx) => ({
            id: img.id,
            previewUrl: normalizeImageUrl(img.image_url),
            isPrimary: img.is_primary,
            sortOrder: img.sort_order ?? idx,
            isExisting: true,
          }))
        );
      }

      // Existing variants
      if (initialData.product_variants && initialData.product_variants.length > 0) {
        setVariants(
          initialData.product_variants.map((v) => ({
            id: v.id,
            storage: v.storage || '',
            ram: v.ram || '',
            color: v.color || '',
            priceOverride: v.price_override,
            stockQty: v.stock_qty || 0,
          }))
        );
      }
    }
  }, [initialData, isEditMode]);

  // Handle image files selection with format & size validation
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
      const isValidMime = validMimes.includes(file.type.toLowerCase()) || isValidExt;

      if (!isValidMime) {
        newErrors.push(`"${file.name}": Unsupported format. Allowed: JPEG, PNG, WebP.`);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        newErrors.push(`"${file.name}": Exceeds 8MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }
      validFiles.push(file);
    });

    if (newErrors.length > 0) {
      setImageErrors(newErrors);
    } else {
      setImageErrors([]);
    }

    if (validFiles.length > 0) {
      const newItems: ImageUploadItem[] = validFiles.map((file, idx) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: images.length === 0 && idx === 0,
        sortOrder: images.length + idx,
        isExisting: false,
      }));
      setImages((prev) => [...prev, ...newItems]);
    }

    // clear input value so same files can be re-selected if removed
    e.target.value = '';
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleRemoveImage = async (index: number) => {
    const target = images[index];
    if (target?.isExisting && target.id) {
      // Delete DB row first, then try to remove storage file; never block on cleanup failure
      try {
        await productAdminService.deleteProductImage(target.id, target.previewUrl);
      } catch (err) {
        console.warn('Non-blocking image cleanup notice:', err);
      }
    }

    setImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // If removed image was primary and there are still images, set first one as primary
      if (prev[index]?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const items = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return items.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  // Variants handlers
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        storage: '128 GB',
        ram: '8 GB',
        color: '',
        priceOverride: null,
        stockQty: 1,
      },
    ]);
  };

  const handleUpdateVariant = (index: number, field: keyof VariantItem, value: unknown) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name_en.trim()) {
      newErrors.name_en = t('products.form.required');
    }

    if (!formData.category_id) {
      newErrors.category_id = t('products.form.required');
    }

    if (formData.price < 0 || isNaN(formData.price)) {
      newErrors.price = t('products.form.priceNonNegative');
    }

    if (formData.sale_price !== null && formData.sale_price !== undefined) {
      if (formData.sale_price < 0 || isNaN(formData.sale_price)) {
        newErrors.sale_price = t('products.form.priceNonNegative');
      } else if (formData.sale_price >= formData.price && formData.price > 0) {
        newErrors.sale_price = t('products.form.salePriceExceeds');
      }
    }

    if (formData.stock_qty < 0 || isNaN(formData.stock_qty)) {
      newErrors.stock_qty = t('products.form.stockNonNegative');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(
      images.some((img) => !img.isExisting)
        ? 'Optimizing photos (max 1200px WebP) and uploading to storage...'
        : 'Saving product specifications...'
    );

    try {
      // Pre-process any newly selected images: resize to max 1200px and convert to WebP (quality ~0.85)
      const optimizedImages: ImageUploadItem[] = [];
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (!item.isExisting && item.file) {
          setUploadProgress(`Optimizing photo ${i + 1} of ${images.length} (max 1200px WebP)...`);
          const { blob } = await resizeAndConvertToWebP(item.file, 1200, 0.85);
          const baseName = item.file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
          optimizedImages.push({
            ...item,
            file: webpFile,
          });
        } else {
          optimizedImages.push(item);
        }
      }

      setUploadProgress('Saving product details and updating database records...');

      if (isEditMode && initialData) {
        const res = await productAdminService.updateProduct(
          initialData.id,
          formData,
          optimizedImages,
          variants
        );
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          setUploadProgress(null);
          return;
        }
      } else {
        const res = await productAdminService.createProduct(
          formData,
          optimizedImages,
          variants
        );
        if (res.error) {
          setSubmitError(res.error.message);
          setIsSubmitting(false);
          setUploadProgress(null);
          return;
        }
      }

      setUploadProgress(null);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/admin/products');
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while saving the product.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs transition-colors"
        >
          <BackIcon className="w-4 h-4" />
          <span>{t('products.form.backToList')}</span>
        </Link>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isEditMode ? t('products.editProduct') : t('products.addProduct')}
        </h1>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error saving product: </span>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>{t('products.saveSuccess')}</span>
        </div>
      )}

      {categories.length === 0 && !loadingLookups && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Categories Required</p>
              <p className="text-slate-600 mt-0.5">
                The database currently contains zero categories. Please create at least one category before adding products.
              </p>
            </div>
          </div>
          <Link
            to="/admin/categories/new"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 text-center"
          >
            + Create Category First
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t('products.form.basicInfo')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name English */}
            <div>
              <label htmlFor="name_en" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.nameEn')} <span className="text-red-500">*</span>
              </label>
              <input
                id="name_en"
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="e.g. iPhone 15 Pro Max 256GB"
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
                {t('products.form.nameUr')}
              </label>
              <input
                id="name_ur"
                type="text"
                dir="rtl"
                value={formData.name_ur}
                onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                placeholder="مثلاً: آئی فون 15 پرو میکس"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-urdu text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.category')} <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.category_id ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">{t('products.form.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isUrdu ? cat.name_ur : cat.name_en}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-[11px] text-red-600 mt-1">{errors.category_id}</p>
              )}
              {categories.length === 0 && !loadingLookups && (
                <div className="flex items-center justify-between text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-1.5">
                  <span>{t('products.form.noCategories')}</span>
                  <Link to="/admin/categories/new" className="font-bold underline text-blue-600 hover:text-blue-800">
                    + Add category
                  </Link>
                </div>
              )}
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand_id" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.brand')}
              </label>
              <select
                id="brand_id"
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('products.form.selectBrand')}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {brands.length === 0 && !loadingLookups && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 mt-1.5">
                  <span>{t('products.form.noBrands')}</span>
                  <Link to="/admin/brands/new" className="font-bold underline text-blue-600 hover:text-blue-800">
                    + Add brand
                  </Link>
                </div>
              )}
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.condition')} <span className="text-red-500">*</span>
              </label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'new' | 'used' })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">{t('products.new')}</option>
                <option value="used">{t('products.used')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description English */}
            <div>
              <label htmlFor="description_en" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.descriptionEn')}
              </label>
              <textarea
                id="description_en"
                rows={3}
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Product overview, key specs, condition notes..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description Urdu */}
            <div>
              <label htmlFor="description_ur" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.descriptionUr')}
              </label>
              <textarea
                id="description_ur"
                rows={3}
                dir="rtl"
                value={formData.description_ur}
                onChange={(e) => setFormData({ ...formData, description_ur: e.target.value })}
                placeholder="پروڈکٹ کی تفصیلات، حالت وغیرہ..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-urdu text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t('products.form.pricingInventory')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Regular Price */}
            <div>
              <label htmlFor="price" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.price')} <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.price ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.price && (
                <p className="text-[11px] text-red-600 mt-1">{errors.price}</p>
              )}
            </div>

            {/* Sale Price */}
            <div>
              <label htmlFor="sale_price" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.salePrice')}
              </label>
              <input
                id="sale_price"
                type="number"
                min="0"
                step="1"
                value={formData.sale_price === null ? '' : formData.sale_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sale_price: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="Optional discounted price"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.sale_price ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.sale_price && (
                <p className="text-[11px] text-red-600 mt-1">{errors.sale_price}</p>
              )}
            </div>

            {/* Stock Quantity */}
            <div>
              <label htmlFor="stock_qty" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.stockQty')} <span className="text-red-500">*</span>
              </label>
              <input
                id="stock_qty"
                type="number"
                min="0"
                step="1"
                value={formData.stock_qty}
                onChange={(e) => setFormData({ ...formData, stock_qty: Number(e.target.value) })}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border ${
                  errors.stock_qty ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                } rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.stock_qty && (
                <p className="text-[11px] text-red-600 mt-1">{errors.stock_qty}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Mobile Specifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t('products.form.mobileInfo')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PTA Status */}
            <div>
              <label htmlFor="pta_status" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.ptaStatus')}
              </label>
              <input
                id="pta_status"
                type="text"
                value={formData.pta_status}
                onChange={(e) => setFormData({ ...formData, pta_status: e.target.value })}
                placeholder="e.g. PTA Approved / Non-PTA"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Battery Health */}
            <div>
              <label htmlFor="battery_health" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.batteryHealth')}
              </label>
              <input
                id="battery_health"
                type="text"
                value={formData.battery_health}
                onChange={(e) => setFormData({ ...formData, battery_health: e.target.value })}
                placeholder="e.g. 100% / 94%"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Warranty Status */}
            <div>
              <label htmlFor="warranty_status" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.warrantyStatus')}
              </label>
              <input
                id="warranty_status"
                type="text"
                value={formData.warranty_status}
                onChange={(e) => setFormData({ ...formData, warranty_status: e.target.value })}
                placeholder="e.g. 1 Year Brand / 1 Month Shop"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Accessories Included */}
            <div>
              <label htmlFor="accessories_included" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('products.form.accessoriesIncluded')}
              </label>
              <input
                id="accessories_included"
                type="text"
                value={formData.accessories_included}
                onChange={(e) => setFormData({ ...formData, accessories_included: e.target.value })}
                placeholder="e.g. Complete Box & Charger"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Product Images (Real Supabase Storage) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>{t('products.form.images')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload photos to bucket <code className="font-semibold text-blue-700">product-images</code>. First or starred image will be primary.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
              <Upload className="w-4 h-4" />
              <span>{t('products.form.uploadImages')}</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
          </div>

          {imageErrors.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Image Validation Errors:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-red-700 space-y-0.5">
                {imageErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-800 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {images.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No product images selected yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Upload JPEG, PNG or WebP images.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, idx) => (
                <div
                  key={img.id || img.previewUrl}
                  className={`group relative rounded-2xl border-2 overflow-hidden bg-slate-100 aspect-square flex flex-col justify-between ${
                    img.isPrimary ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={img.previewUrl}
                    alt={`Product preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Top badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="px-1.5 py-0.5 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                      #{idx + 1}
                    </span>
                    {img.isPrimary && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        {t('products.form.primary')}
                      </span>
                    )}
                  </div>

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        <span>{t('products.form.setPrimary')}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, 'up')}
                        className="p-1.5 bg-white/20 hover:bg-white/40 disabled:opacity-30 rounded-lg text-white"
                        title="Move left/up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMoveImage(idx, 'down')}
                        className="p-1.5 bg-white/20 hover:bg-white/40 disabled:opacity-30 rounded-lg text-white"
                        title="Move right/down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Product Variants (Storage / RAM / Colors) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>{t('products.form.variants')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Optional: define memory variations, colors, and variant-specific prices.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('products.form.addVariant')}</span>
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No variants defined. The product will be sold with standard base specifications.
            </p>
          ) : (
            <div className="space-y-3 overflow-x-auto">
              <div className="min-w-[650px] space-y-2">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <span className="font-bold text-slate-400 w-6 text-center">#{idx + 1}</span>

                    {/* Storage */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {t('products.form.storage')}
                      </label>
                      <input
                        type="text"
                        value={v.storage}
                        onChange={(e) => handleUpdateVariant(idx, 'storage', e.target.value)}
                        placeholder="128 GB"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    {/* RAM */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {t('products.form.ram')}
                      </label>
                      <input
                        type="text"
                        value={v.ram}
                        onChange={(e) => handleUpdateVariant(idx, 'ram', e.target.value)}
                        placeholder="8 GB"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    {/* Color */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {t('products.form.color')}
                      </label>
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                        placeholder="Midnight Black"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    {/* Price Override */}
                    <div className="w-32">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {t('products.form.priceOverride')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.priceOverride === null ? '' : v.priceOverride}
                        onChange={(e) =>
                          handleUpdateVariant(
                            idx,
                            'priceOverride',
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        placeholder="Default"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    {/* Stock Qty */}
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {t('products.form.variantStock')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.stockQty}
                        onChange={(e) =>
                          handleUpdateVariant(idx, 'stockQty', Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors mt-3"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Settings / Toggles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            {t('products.form.settings')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Active Toggle */}
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {t('products.form.isActive')}
              </span>
            </label>

            {/* Featured Toggle */}
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {t('products.form.isFeatured')}
              </span>
            </label>

            {/* Installment Toggle */}
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={formData.installment_available}
                onChange={(e) => setFormData({ ...formData, installment_available: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {t('products.form.installmentAvailable')}
              </span>
            </label>
          </div>
        </div>

        {/* Submit / Cancel Bar */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Link
            to="/admin/products"
            className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {t('products.form.cancel')}
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('products.form.saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('products.form.save')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
