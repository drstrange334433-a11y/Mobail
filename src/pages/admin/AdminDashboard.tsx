import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Smartphone, 
  ShoppingBag, 
  ImageIcon, 
  FolderTree, 
  Tag,
  Star,
  Database, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  Download,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, type DashboardStats } from '../../services/adminService';
import type { Product, Order } from '../../types/database';
import { getProductImageUrl, handleProductImageError } from '../../utils/productImages';
import { slugify } from '../../utils/imageProcessor';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Link, useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageCoverage, setImageCoverage] = useState<{
    total: number;
    withImage: number;
    withoutImage: number;
    missingList: Array<{ category: string; name_en: string; expected_file_name: string }>;
  }>({
    total: 0,
    withImage: 0,
    withoutImage: 0,
    missingList: [],
  });
  const isUrdu = i18n.language?.startsWith('ur');

  const fetchStats = async () => {
    try {
      const [statsData, prodsRes, ordersRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentProducts(5),
        adminService.getRecentOrders(5),
      ]);
      setStats(statsData);
      setRecentProducts(prodsRes.data || []);
      setRecentOrders(ordersRes.data || []);

      if (isSupabaseConfigured) {
        const { data: prodsWithImages } = await supabase
          .from('products')
          .select(`
            id,
            name_en,
            categories ( name_en ),
            product_images ( id )
          `);

        if (prodsWithImages) {
          const total = prodsWithImages.length;
          const withImg = prodsWithImages.filter((p: any) => p.product_images && p.product_images.length > 0).length;
          const withoutImg = total - withImg;
          const missing = prodsWithImages
            .filter((p: any) => !p.product_images || p.product_images.length === 0)
            .map((p: any) => ({
              category: p.categories?.name_en || 'General',
              name_en: p.name_en,
              expected_file_name: `${slugify(p.name_en)}.webp`,
            }));

          setImageCoverage({
            total,
            withImage: withImg,
            withoutImage: withoutImg,
            missingList: missing,
          });
        }
      }
    } catch {
      setStats({
        totalProducts: null,
        totalOrders: null,
        activeBanners: null,
        totalCategories: null,
        totalBrands: null,
        activeTestimonials: null,
        isConfigured: false,
        error: 'Failed to fetch statistics',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleExportMissingCSV = () => {
    if (imageCoverage.missingList.length === 0) {
      alert('All products currently have images! Nothing to export.');
      return;
    }

    const headers = ['category', 'product name', 'expected_file_name'];
    const rows = imageCoverage.missingList.map((item) => [
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.name_en.replace(/"/g, '""')}"`,
      `"${item.expected_file_name.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `paracha-missing-product-images-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingState message="Loading administrative metrics from Supabase..." />;
  }

  const statCards = [
    {
      title: t('admin.stats.totalProducts'),
      value: stats?.totalProducts !== null && stats?.totalProducts !== undefined ? stats.totalProducts : '—',
      icon: Smartphone,
      color: 'blue',
      route: '/admin/products',
      available: stats?.totalProducts !== null,
    },
    {
      title: t('admin.stats.totalOrders'),
      value: stats?.totalOrders !== null && stats?.totalOrders !== undefined ? stats.totalOrders : '—',
      icon: ShoppingBag,
      color: 'emerald',
      route: '/admin/orders',
      available: stats?.totalOrders !== null,
    },
    {
      title: t('admin.stats.activeBanners'),
      value: stats?.activeBanners !== null && stats?.activeBanners !== undefined ? stats.activeBanners : '—',
      icon: ImageIcon,
      color: 'indigo',
      route: '/admin/banners',
      available: stats?.activeBanners !== null,
    },
    {
      title: t('admin.stats.categories'),
      value: stats?.totalCategories !== null && stats?.totalCategories !== undefined ? stats.totalCategories : '—',
      icon: FolderTree,
      color: 'amber',
      route: '/admin/categories',
      available: stats?.totalCategories !== null,
    },
    {
      title: t('admin.stats.brands'),
      value: stats?.totalBrands !== null && stats?.totalBrands !== undefined ? stats.totalBrands : '—',
      icon: Tag,
      color: 'teal',
      route: '/admin/brands',
      available: stats?.totalBrands !== null,
    },
    {
      title: t('admin.stats.activeTestimonials'),
      value: stats?.activeTestimonials !== null && stats?.activeTestimonials !== undefined ? stats.activeTestimonials : '—',
      icon: Star,
      color: 'amber',
      route: '/admin/testimonials',
      available: stats?.activeTestimonials !== null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              <span>Phase 2 Production Management</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isUrdu ? 'خوش آمدید، ایڈمن' : 'Welcome to Paracha Mobile Control'}
            </h2>
            <p className="text-blue-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              {t('brand.tagline')} — Live administration interface connected to PostgreSQL with Row Level Security.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md rounded-xl text-xs font-semibold text-white transition-all border border-white/20 focus:outline-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t('common.loading') : 'Refresh DB'}</span>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-900 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>{t('brand.shortName')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Database connection details banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2.5 rounded-xl ${stats?.isConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                PostgreSQL & Supabase Architecture
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                stats?.isConfigured 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {stats?.isConfigured ? 'Active / Configured' : 'Env Setup Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats?.isConfigured 
                ? 'All queries are communicating directly with your live Supabase database.' 
                : 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to stream live catalog statistics.'}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 sm:text-right">
          <div className="font-semibold text-slate-800">Administrator Session</div>
          <div className="font-mono text-slate-500 text-[11px] truncate max-w-[200px]">
            {user?.email}
          </div>
        </div>
      </div>

      {stats?.error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Database Query Status: </strong>
            <span>{stats.error}</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className={`text-xs font-bold text-slate-600 ${isUrdu ? 'font-urdu' : ''}`}>
                  {stat.title}
                </span>
                <div className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                {!stat.available && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {t('common.unavailable')}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <Link
                  to={stat.route}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Manage {stat.title}</span>
                </Link>
                <span className="text-slate-400 font-mono">Real DB</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Coverage Panel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {isUrdu ? 'پروڈکٹ امیج کوریج' : 'Product Image Coverage'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time catalog imagery status. Only photos uploaded in the admin panel are used.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportMissingCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Download CSV list of products missing images"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Missing CSV ({imageCoverage.withoutImage})</span>
            </button>

            <Link
              to="/admin/bulk-images"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-600/20"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Bulk Image Upload</span>
            </Link>
          </div>
        </div>

        {/* Coverage Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {imageCoverage.total}
            </div>
            <span className="text-[11px] text-slate-400">In database catalog</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              With Images
            </span>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              {imageCoverage.withImage}
            </div>
            <span className="text-[11px] text-emerald-600">
              {imageCoverage.total > 0
                ? `${((imageCoverage.withImage / imageCoverage.total) * 100).toFixed(1)}% covered`
                : '0% covered'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Without Image
            </span>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {imageCoverage.withoutImage}
            </div>
            <span className="text-[11px] text-amber-700">Showing category fallback SVG</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Overall Image Coverage</span>
            <span className="font-mono">
              {imageCoverage.total > 0
                ? `${((imageCoverage.withImage / imageCoverage.total) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${imageCoverage.total > 0 ? (imageCoverage.withImage / imageCoverage.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{
                width: `${imageCoverage.total > 0 ? (imageCoverage.withoutImage / imageCoverage.total) * 100 : 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Foundation Sections Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>{t('admin.recentProducts')}</span>
            </h3>
            <Link
              to="/admin/products"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              View All
            </Link>
          </div>

          {recentProducts.length > 0 ? (
            <div className="space-y-3">
              {recentProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                      <img
                        src={getProductImageUrl(p)}
                        alt={p.name_en}
                        onError={handleProductImageError}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {p.name_en}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        PKR {Number(p.price).toLocaleString()} • Stock: {p.stock_qty}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/admin/products/${p.id}/edit`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('admin.noProducts')}
              message="No products found in the database. Click below to add your first product."
              actionText={t('products.addProduct')}
              onAction={() => navigate('/admin/products/new')}
            />
          )}
        </div>

        {/* Recent Orders Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>{t('admin.recentOrders')}</span>
            </h3>
            <Link
              to="/admin/orders"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              View All
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-700">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {o.customer_name} (#{o.id.slice(0, 8).toUpperCase()})
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        PKR {Number(o.total_price).toLocaleString()} • {o.status}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/admin/orders/${o.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('admin.noOrders')}
              message="No customer orders recorded yet in the database."
            />
          )}
        </div>
      </div>

      {/* Phase 1 Completion Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Phase 1 Architecture Checklist Verified:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Supabase Auth & Session listener</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>PostgreSQL Schema & RLS policies</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Urdu + English full RTL architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Protected Admin routes & redirect</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Storage buckets foundation script</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Zero mock data policy enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
