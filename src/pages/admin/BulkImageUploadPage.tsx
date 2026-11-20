import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Trash2,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  Search,
  FileArchive,
  Download,
  AlertTriangle,
  Check,
  ChevronDown,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  slugify,
  resizeAndConvertToWebP,
  extractImagesFromZip,
  matchFileNameToProduct
} from '../../utils/imageProcessor';

interface BulkFileItem {
  id: string;
  file: File;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  fileSlug: string;
  matchedProductId: string | null;
  isPrimary: boolean;
  sortOrder: number;
  status: 'idle' | 'resizing' | 'uploading' | 'success' | 'error' | 'skipped';
  message?: string;
}

interface ProductOption {
  id: string;
  name_en: string;
  name_ur: string | null;
  slug: string;
  category_name: string;
  hasPrimaryImage: boolean;
  totalImages: number;
}

export const BulkImageUploadPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [items, setItems] = useState<BulkFileItem[]>([]);
  const [replacePrimary, setReplacePrimary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadSummary, setUploadSummary] = useState<{
    success: number;
    skipped: number;
    failed: number;
  } | null>(null);

  // Active view tab: 'queue' or 'missing'
  const [activeTab, setActiveTab] = useState<'queue' | 'missing'>('queue');
  const [missingSearch, setMissingSearch] = useState('');

  // Search filter for dropdown mapping
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');

  // Load products and their image status
  const loadProducts = async () => {
    if (!isSupabaseConfigured) {
      setLoadingProducts(false);
      return;
    }

    try {
      setLoadingProducts(true);
      const { data: prods, error: pErr } = await supabase
        .from('products')
        .select(`
          id,
          name_en,
          name_ur,
          categories ( name_en ),
          product_images (
            id,
            is_primary
          )
        `)
        .order('name_en', { ascending: true });

      if (pErr) throw pErr;

      const mapped: ProductOption[] = (prods || []).map((p: any) => {
        const imagesList = Array.isArray(p.product_images) ? p.product_images : [];
        const hasPrimary = imagesList.some((img: any) => img.is_primary);
        return {
          id: p.id,
          name_en: p.name_en,
          name_ur: p.name_ur || null,
          slug: slugify(p.name_en),
          category_name: p.categories?.name_en || 'General',
          hasPrimaryImage: hasPrimary,
          totalImages: imagesList.length,
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error('Failed to load products for bulk matching:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Process incoming files (images or zip)
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    const errs: string[] = [];
    let filesToProcess: File[] = [];

    setIsProcessing(true);

    for (const file of rawFiles) {
      // Check if it's a zip file
      if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        try {
          const zipResult = await extractImagesFromZip(file, 8 * 1024 * 1024);
          filesToProcess = [...filesToProcess, ...zipResult.files];
          if (zipResult.warnings.length > 0) {
            errs.push(...zipResult.warnings);
          }
        } catch (zErr: any) {
          errs.push(`ZIP Error (${file.name}): ${zErr.message}`);
        }
      } else {
        filesToProcess.push(file);
      }
    }

    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newItems: BulkFileItem[] = [];

    filesToProcess.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
      const isValidMime = validMimes.includes(file.type.toLowerCase()) || isValidExt;

      if (!isValidMime) {
        errs.push(`"${file.name}": Unsupported format. Only JPEG, PNG, and WebP are accepted.`);
        return;
      }

      // Max 8MB
      if (file.size > 8 * 1024 * 1024) {
        errs.push(`"${file.name}": File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 8MB limit.`);
        return;
      }

      const match = matchFileNameToProduct(file.name, products);

      newItems.push({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileSlug: match.productSlug,
        matchedProductId: match.productId,
        isPrimary: match.isPrimary,
        sortOrder: match.sortOrder,
        status: 'idle',
      });
    });

    setValidationErrors(errs);
    setUploadSummary(null);
    setItems((prev) => [...prev, ...newItems]);
    setIsProcessing(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProductChange = (itemId: string, newProductId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              matchedProductId: newProductId || null,
              isPrimary: true,
              sortOrder: 0,
            }
          : item
      )
    );
    setOpenDropdownId(null);
  };

  const handleClearAll = () => {
    setItems([]);
    setValidationErrors([]);
    setUploadSummary(null);
  };

  // Missing images calculation
  const missingProducts = useMemo(() => {
    return products.filter((p) => !p.hasPrimaryImage && p.totalImages === 0);
  }, [products]);

  const filteredMissing = useMemo(() => {
    if (!missingSearch.trim()) return missingProducts;
    const q = missingSearch.toLowerCase();
    return missingProducts.filter(
      (p) =>
        p.name_en.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q)
    );
  }, [missingProducts, missingSearch]);

  // Export missing products as CSV
  const handleExportMissingCSV = () => {
    if (missingProducts.length === 0) {
      alert('All products currently have images! Nothing to export.');
      return;
    }

    const headers = ['category', 'product name', 'expected_file_name'];
    const rows = missingProducts.map((p) => [
      `"${p.category_name.replace(/"/g, '""')}"`,
      `"${p.name_en.replace(/"/g, '""')}"`,
      `"${p.slug}.webp"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `paracha-missing-images-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform bulk upload
  const handleStartUpload = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase is not configured.');
      return;
    }

    const eligibleItems = items.filter((item) => item.matchedProductId && item.status !== 'success');
    if (eligibleItems.length === 0) return;

    setIsProcessing(true);
    setUploadSummary(null);

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Group items by product id
    const itemsByProduct = new Map<string, BulkFileItem[]>();
    eligibleItems.forEach((item) => {
      const pId = item.matchedProductId!;
      if (!itemsByProduct.has(pId)) {
        itemsByProduct.set(pId, []);
      }
      itemsByProduct.get(pId)!.push(item);
    });

    for (const [productId, prodItems] of itemsByProduct.entries()) {
      const prodInfo = products.find((p) => p.id === productId);
      const hasExistingPrimary = prodInfo?.hasPrimaryImage ?? false;

      // Skip products that already have a primary image unless "Replace existing" is ticked
      if (hasExistingPrimary && !replacePrimary) {
        prodItems.forEach((item) => {
          item.status = 'skipped';
          item.message = 'Skipped: Product already has a primary image (Replace not ticked)';
          skippedCount++;
        });
        setItems((prev) => [...prev]);
        continue;
      }

      // If replacing existing primary image, unset previous primary flag
      if (hasExistingPrimary && replacePrimary) {
        try {
          await supabase
            .from('product_images')
            .update({ is_primary: false })
            .eq('product_id', productId);
        } catch (uErr) {
          console.warn('Failed to unset previous primary images:', uErr);
        }
      }

      // Sort items: item marked as isPrimary comes first, then by sortOrder
      prodItems.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.sortOrder - b.sortOrder;
      });

      // Upload each file for this product
      for (let i = 0; i < prodItems.length; i++) {
        const item = prodItems[i];
        item.status = 'resizing';
        item.message = 'Resizing & converting to WebP...';
        setItems((prev) => [...prev]);

        try {
          // 1. Resize in the browser to max 1200px on the long side and convert to WebP (quality 0.85)
          const processed = await resizeAndConvertToWebP(item.file, 1200, 0.85);

          item.status = 'uploading';
          item.message = 'Uploading to product-images bucket...';
          setItems((prev) => [...prev]);

          const fileUuid = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const filePath = `${productId}/${fileUuid}.webp`;

          // 2. Upload to bucket product-images with unique path (productId/uuid.webp)
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, processed.blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'image/webp',
            });

          if (uploadError || !uploadData) {
            throw new Error(uploadError?.message || 'Storage upload failed');
          }

          // 3. Obtain public URL
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(uploadData.path);

          // First image per product = primary (is_primary true)
          const isPrimary = i === 0;

          // 4. Create product_images row
          const { error: insertError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              image_url: publicUrlData.publicUrl,
              is_primary: isPrimary,
              sort_order: i,
            });

          if (insertError) {
            throw new Error(insertError.message);
          }

          item.status = 'success';
          item.message = isPrimary ? 'Uploaded (Primary Image)' : `Uploaded (Gallery #${i + 1})`;
          successCount++;
        } catch (err: any) {
          item.status = 'error';
          item.message = err?.message || 'Upload failed';
          failedCount++;
        }

        setItems((prev) => [...prev]);
      }
    }

    setIsProcessing(false);
    setUploadSummary({
      success: successCount,
      skipped: skippedCount,
      failed: failedCount,
    });

    // Refresh products list
    await loadProducts();
  };

  const matchedCount = items.filter((i) => i.matchedProductId).length;
  const unmatchedCount = items.filter((i) => !i.matchedProductId).length;
  const readyCount = items.filter((i) => i.matchedProductId && i.status !== 'success').length;

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <BackIcon className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-600" />
            <span>Bulk Image Upload Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-match images or ZIP archives by filename slug. Resizes to 1200px max and converts to WebP before upload.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/image-prompts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 shadow-xs transition-colors"
            title="View ready-to-use realistic image prompts for banners, categories, and generic accessories"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Prompts Guide</span>
          </Link>

          <button
            onClick={handleExportMissingCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
            title="Download CSV of products needing images"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Missing CSV ({missingProducts.length})</span>
          </button>
        </div>
      </div>

      {/* Tabs bar: Queue vs Missing Images */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'queue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Upload Queue</span>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">
              {items.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'missing'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Missing Images List</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
            {missingProducts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: UPLOAD QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          {/* Dropzone & Control Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.005]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <FileArchive className="w-6 h-6" />
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Drag & Drop images or a <strong className="text-indigo-600">.ZIP archive</strong> here, or{' '}
                  <span className="text-blue-600 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
                  Accepted formats: <strong>JPEG, PNG, WebP</strong> or <strong>.ZIP</strong> (up to 8MB per image).
                  <br />
                  Naming rule: <code className="px-1.5 py-0.5 bg-slate-200/80 rounded font-mono text-[11px]">&lt;slug&gt;.ext</code> for primary, and{' '}
                  <code className="px-1.5 py-0.5 bg-slate-200/80 rounded font-mono text-[11px]">&lt;slug&gt;-2.ext</code>, <code className="px-1.5 py-0.5 bg-slate-200/80 rounded font-mono text-[11px]">&lt;slug&gt;-3.ext</code> for extra gallery photos.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Select Image Files
                </button>
                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Select ZIP Archive
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                className="hidden"
              />
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip,application/zip"
                onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Global Controls & Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={replacePrimary}
                  onChange={(e) => setReplacePrimary(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Replace existing primary images
                  </span>
                  <p className="text-[11px] text-slate-500">
                    When unchecked, products that already have a primary image will be skipped.
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
                  >
                    Clear Queue
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleStartUpload}
                  disabled={isProcessing || readyCount === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Process & Upload {readyCount} Matched Images</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Validation Errors Box */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>File Validation Warnings ({validationErrors.length})</span>
                </div>
                <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Banner */}
            {uploadSummary && (
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-sm">Bulk Upload Pipeline Completed</span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      <strong className="text-emerald-400">{uploadSummary.success}</strong> uploaded successfully •{' '}
                      <strong className="text-amber-400">{uploadSummary.skipped}</strong> skipped •{' '}
                      <strong className="text-red-400">{uploadSummary.failed}</strong> failed
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/products"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors text-center shrink-0"
                >
                  View Catalog
                </Link>
              </div>
            )}
          </div>

          {/* Batch Preview Table */}
          {items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Upload Queue ({items.length} Files)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {matchedCount} matched, {unmatchedCount} unmatched. Click any unmatched row to search and map to a product.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {matchedCount} Matched
                  </span>
                  {unmatchedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                      {unmatchedCount} Unmatched
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Image Preview</th>
                      <th className="py-3 px-4">Original Filename</th>
                      <th className="py-3 px-4">Assigned Product (Searchable)</th>
                      <th className="py-3 px-4">Role & Placement</th>
                      <th className="py-3 px-4">Upload Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const matchedProd = products.find((p) => p.id === item.matchedProductId);
                      const willSkip = matchedProd?.hasPrimaryImage && !replacePrimary;
                      const isDropdownOpen = openDropdownId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.status === 'success'
                              ? 'bg-emerald-50/30'
                              : item.status === 'error'
                              ? 'bg-red-50/30'
                              : item.status === 'skipped'
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          {/* Image Preview */}
                          <td className="py-3 px-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              <img
                                src={item.previewUrl}
                                alt={item.fileName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>

                          {/* File Details */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block max-w-xs truncate" title={item.fileName}>
                              {item.fileName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {(item.fileSize / 1024).toFixed(0)} KB • slug: {item.fileSlug}
                            </span>
                          </td>

                          {/* Searchable Product Dropdown */}
                          <td className="py-3 px-4 max-w-sm relative">
                            {isDropdownOpen ? (
                              <div className="absolute top-2 left-4 z-30 w-72 bg-white border border-slate-300 rounded-xl shadow-xl p-2 space-y-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                                  <Search className="w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    value={dropdownSearch}
                                    onChange={(e) => setDropdownSearch(e.target.value)}
                                    placeholder="Search product..."
                                    autoFocus
                                    className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setOpenDropdownId(null)}
                                    className="p-0.5 hover:bg-slate-200 rounded"
                                  >
                                    <X className="w-3 h-3 text-slate-500" />
                                  </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleProductChange(item.id, '')}
                                    className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-red-600 rounded font-medium"
                                  >
                                    -- Unassign / Skip --
                                  </button>
                                  {products
                                    .filter(
                                      (p) =>
                                        !dropdownSearch.trim() ||
                                        p.name_en.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
                                        p.slug.includes(slugify(dropdownSearch))
                                    )
                                    .map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleProductChange(item.id, p.id)}
                                        className={`w-full text-left px-2 py-1.5 rounded transition-colors flex items-center justify-between ${
                                          item.matchedProductId === p.id
                                            ? 'bg-blue-50 text-blue-700 font-bold'
                                            : 'hover:bg-slate-100 text-slate-800'
                                        }`}
                                      >
                                        <span className="truncate pr-2">{p.name_en}</span>
                                        <span className="text-[10px] text-slate-400 shrink-0">
                                          {p.hasPrimaryImage ? '★ Primary' : 'No img'}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(item.id);
                                  setDropdownSearch('');
                                }}
                                disabled={isProcessing || item.status === 'success'}
                                className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2 text-left ${
                                  item.matchedProductId
                                    ? 'border-emerald-300 bg-emerald-50/60 text-slate-900'
                                    : 'border-amber-300 bg-amber-50/70 text-amber-900 ring-1 ring-amber-300'
                                }`}
                              >
                                <span className="truncate">
                                  {matchedProd ? matchedProd.name_en : 'No Match — Click to Assign'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              </button>
                            )}
                          </td>

                          {/* Role & Placement */}
                          <td className="py-3 px-4">
                            {!item.matchedProductId ? (
                              <span className="text-[11px] text-slate-400 italic">Not Assigned</span>
                            ) : willSkip ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <AlertCircle className="w-3 h-3" />
                                <span>Will Skip (Has Primary)</span>
                              </span>
                            ) : matchedProd?.hasPrimaryImage && replacePrimary ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                <RefreshCw className="w-3 h-3" />
                                <span>Will Replace Primary</span>
                              </span>
                            ) : item.isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Sparkles className="w-3 h-3" />
                                <span>Primary Image</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                <span>Gallery #{item.sortOrder + 1}</span>
                              </span>
                            )}
                          </td>

                          {/* Upload Status */}
                          <td className="py-3 px-4">
                            {item.status === 'resizing' && (
                              <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-[11px]">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Resizing 1200px...</span>
                              </span>
                            )}
                            {item.status === 'uploading' && (
                              <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-[11px]">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Uploading WebP...</span>
                              </span>
                            )}
                            {item.status === 'success' && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <Check className="w-3.5 h-3.5" />
                                <span>{item.message || 'Complete'}</span>
                              </span>
                            )}
                            {item.status === 'skipped' && (
                              <span className="text-amber-700 font-medium text-[11px]">
                                {item.message || 'Skipped'}
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-red-600 font-semibold text-[11px]" title={item.message}>
                                {item.message || 'Error'}
                              </span>
                            )}
                            {item.status === 'idle' && (
                              <span className="text-slate-400 text-[11px]">Ready</span>
                            )}
                          </td>

                          {/* Remove Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MISSING IMAGES LIST */}
      {activeTab === 'missing' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Products Missing Images ({missingProducts.length} of {products.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These products currently have zero images uploaded. Name your image files to match the expected filename column below.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={missingSearch}
                  onChange={(e) => setMissingSearch(e.target.value)}
                  placeholder="Filter missing products..."
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleExportMissingCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Product Name (English)</th>
                  <th className="py-3 px-4">Primary Filename Expected</th>
                  <th className="py-3 px-4">Secondary Filenames</th>
                  <th className="py-3 px-4 text-right">Quick Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMissing.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-600">
                      {p.category_name}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {p.name_en}
                    </td>
                    <td className="py-2.5 px-4">
                      <code className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded font-mono text-[11px] text-blue-700 font-bold">
                        {p.slug}.webp
                      </code>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                      {p.slug}-2.webp, {p.slug}-3.webp
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
