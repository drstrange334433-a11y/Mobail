import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { catalogService, type CatalogProduct } from '../../services/catalogService';
import { getProductImageUrl, handleProductImageError } from '../../utils/productImages';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Smartphone, SlidersHorizontal } from 'lucide-react';

export const ShopPage: React.FC<{ filterCondition?: 'new' | 'used' }> = ({ filterCondition }) => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const isUrdu = i18n.language?.startsWith('ur');

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await catalogService.getProducts({ condition: filterCondition });
        if (isMounted) {
          setProducts(res.data || []);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [filterCondition]);

  const pageTitle = filterCondition === 'new' 
    ? t('nav.newMobiles') 
    : filterCondition === 'used' 
    ? t('nav.usedMobiles') 
    : t('nav.shop');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ${isUrdu ? 'font-urdu' : ''}`}>
            {pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse authentic devices with verified PTA status and warranty.
          </p>
        </div>

        {/* Filter bar status */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>{products.length} {products.length === 1 ? 'Device' : 'Devices'} Listed</span>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Connecting to PostgreSQL database..." />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const imageUrl = getProductImageUrl(p);
            return (
              <div 
                key={p.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <Link 
                    to={`/product/${p.id}`}
                    className="aspect-square bg-slate-50/70 rounded-xl mb-3 flex items-center justify-center p-3 overflow-hidden border border-slate-100 block relative"
                  >
                    <img
                      src={imageUrl}
                      alt={p.name_en}
                      onError={handleProductImageError}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
                        p.condition === 'new'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.condition === 'new' ? t('products.new', 'New') : t('products.used', 'Used')}
                    </span>
                  </Link>

                  <div className="flex items-center gap-2 mb-1">
                    {p.pta_status && (
                      <span className="text-[10px] font-medium text-slate-500">
                        {p.pta_status}
                      </span>
                    )}
                  </div>

                  <Link to={`/product/${p.id}`} className="block">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-blue-600 transition-colors">
                      {isUrdu ? p.name_ur : p.name_en}
                    </h3>
                  </Link>

                  <div className="text-xs font-mono font-bold text-blue-600 mt-1">
                    PKR {p.price.toLocaleString()}
                  </div>
                </div>

                <Link
                  to={`/product/${p.id}`}
                  className="mt-4 block text-center py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                >
                  {t('common.viewDetails', 'View Details')}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No ${filterCondition || ''} products in database`}
          message="Once products are added to your Supabase PostgreSQL instance via the admin portal, they will appear here automatically."
          icon={<Smartphone className="w-8 h-8 text-blue-600" />}
        />
      )}
    </div>
  );
};
