import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { catalogService, type CatalogProduct } from '../../services/catalogService';
import { getProductImageUrl, handleProductImageError, normalizeImageUrl } from '../../utils/productImages';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ArrowLeft, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await catalogService.getProductById(id);

        if (isMounted) {
          setProduct(data);
          if (data) {
            setActiveImage(getProductImageUrl(data));
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading device specifications..." />;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          title="Product Not Found"
          message={`No product with ID ${id} was found in the active catalog.`}
          actionText="Back to Shop"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const primaryImageUrl = activeImage || getProductImageUrl(product);
  const galleryImages = (product.product_images && product.product_images.length > 0)
    ? product.product_images.map((img) => normalizeImageUrl(img.image_url))
    : [primaryImageUrl];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
      >
        <BackIcon className="w-4 h-4" />
        <span>{t('nav.shop')}</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Product Media Gallery */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square bg-slate-50/70 rounded-2xl flex items-center justify-center p-6 border border-slate-100 overflow-hidden relative group">
            <img
              src={primaryImageUrl}
              alt={product.name_en}
              onError={handleProductImageError}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="eager"
            />
            {product.condition === 'used' && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                {t('products.used', 'Used')}
              </span>
            )}
          </div>

          {/* Multiple gallery thumbnails if present */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-16 h-16 rounded-xl border p-1 shrink-0 overflow-hidden bg-white transition-all ${
                    activeImage === imgUrl ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name_en} - View ${idx + 1}`}
                    loading="lazy"
                    onError={handleProductImageError}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 mb-2">
              {product.condition}
            </span>
            <h1 className={`text-2xl sm:text-3xl font-extrabold text-slate-900 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? product.name_ur : product.name_en}
            </h1>
          </div>

          <div className="text-3xl font-black text-blue-600 font-mono">
            {t('common.pkr')} {product.price.toLocaleString()}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">PTA Status:</span>
              <span className="font-semibold text-slate-800">{product.pta_status || 'PTA Approved'}</span>
            </div>
            {product.warranty_status && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Warranty:</span>
                <span className="font-semibold text-slate-800">{product.warranty_status}</span>
              </div>
            )}
            {product.battery_health && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Battery Health:</span>
                <span className="font-semibold text-slate-800">{product.battery_health}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            Phase 3: Interactive cart and direct WhatsApp ordering will activate in Phase 3.
          </div>
        </div>
      </div>
    </div>
  );
};
