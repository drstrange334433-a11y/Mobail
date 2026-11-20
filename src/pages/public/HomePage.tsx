import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Award, 
  Headphones, 
  Percent, 
  CheckCircle2, 
  ShoppingBag
} from 'lucide-react';
import { catalogService, type CatalogProduct } from '../../services/catalogService';
import type { Category, Brand, Banner } from '../../types/database';
import { getProductImageUrl, handleProductImageError } from '../../utils/productImages';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { HomeHeroBanners } from '../../components/public/HomeHeroBanners';
import { TestimonialsSection } from '../../components/public/TestimonialsSection';

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isUrdu = i18n.language?.startsWith('ur');
  const ArrowIcon = isUrdu ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const [catsRes, brandsRes, prodsRes, bannersRes] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands(),
          catalogService.getFeaturedProducts(6),
          catalogService.getBanners(),
        ]);

        if (isMounted) {
          setCategories(catsRes.data || []);
          setBrands(brandsRes.data || []);
          setProducts(prodsRes.data || []);
          setBanners(bannersRes.data || []);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Dynamic Database Hero Banners Carousel (if banners created in Supabase) OR Baseline Hero Section */}
      {banners.length > 0 ? (
        <HomeHeroBanners banners={banners} />
      ) : (
        /* Fallback Baseline Hero Section when database has no banners configured */
        <section className="relative bg-linear-to-b from-blue-900 via-blue-950 to-slate-950 text-white overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-blue-900/40">
          {/* Ambient background glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>{t('brand.tagline')}</span>
              </div>

              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white ${isUrdu ? 'font-urdu' : ''}`}>
                {t('home.heroTitle')}
              </h1>

              <p className={`text-slate-300 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed ${isUrdu ? 'font-urdu' : ''}`}>
                {t('home.heroSubtitle')}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <span>{t('home.exploreCatalog')}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition-all focus:outline-none"
                >
                  <span>{t('home.contactUs')}</span>
                </Link>
              </div>
            </div>

            {/* Hero Side Highlight Badge Box */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    {t('brand.name')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Store
                  </span>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{t('home.trustedFeatures.trustTitle')}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">{t('home.trustedFeatures.trustDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{t('home.trustedFeatures.warrantyTitle')}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">{t('home.trustedFeatures.warrantyDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{t('home.trustedFeatures.ratesTitle')}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">{t('home.trustedFeatures.ratesDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Phase 1 Production Ready</span>
                  <span className="font-mono text-blue-300">Live PostgreSQL RLS</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('home.categoriesTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top hardware departments at Paracha Mobile Shop
            </p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>{t('nav.shop')}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingState message="Loading categories..." minHeight="min-h-[160px]" />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {isUrdu ? cat.name_ur : cat.name_en}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('home.emptyCategories')}
            message="Categories configured in the PostgreSQL database will appear here automatically."
            icon={<Smartphone className="w-6 h-6 text-blue-600" />}
          />
        )}
      </section>

      {/* Featured Products Showcase Section (Zero fake data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('home.featuredTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('home.featuredSubtitle')}
            </p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>{t('nav.shop')}</span>
            <ArrowIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingState message="Loading products..." minHeight="min-h-[200px]" />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product);
              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Product Card Image Container */}
                    <Link
                      to={`/product/${product.id}`}
                      className="aspect-square bg-slate-50/70 rounded-xl mb-4 flex items-center justify-center p-3 overflow-hidden border border-slate-100 block relative"
                    >
                      <img
                        src={imageUrl}
                        alt={product.name_en}
                        onError={handleProductImageError}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.condition === 'used' && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                          {t('products.used', 'Used')}
                        </span>
                      )}
                    </Link>

                    <Link to={`/product/${product.id}`} className="block">
                      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 hover:text-blue-600 transition-colors">
                        {isUrdu ? product.name_ur : product.name_en}
                      </h3>
                    </Link>

                    <div className="text-xs font-mono font-bold text-blue-600">
                      {t('common.pkr')} {product.price.toLocaleString()}
                    </div>
                  </div>

                  <Link
                    to={`/product/${product.id}`}
                    className="mt-4 block text-center py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                  >
                    {t('common.viewDetails')}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={t('home.emptyProducts')}
            message="No mock records are displayed. Live database items created in the admin portal will display here in real time."
            icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          />
        )}
      </section>

      {/* Verified Customer Testimonials */}
      <TestimonialsSection />

      {/* Authorized Brands */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="border-t border-slate-200 pt-10">
          <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            {t('home.brandsTitle')}
          </h3>
          {brands.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-8">
              {brands.map((b) => (
                <div key={b.id} className="text-slate-600 font-bold text-sm tracking-wide">
                  {b.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 font-semibold text-xs">
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Apple</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Samsung</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Xiaomi</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Vivo</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Oppo</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Realme</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Infinix</span>
              <span className="px-3 py-1 bg-slate-100 rounded-lg">Tecno</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
