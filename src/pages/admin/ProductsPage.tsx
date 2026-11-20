import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Edit, 
  Trash2, 
  Smartphone, 
  Star, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  ExternalLink,
  UploadCloud
} from 'lucide-react';
import { productAdminService } from '../../services/productAdminService';
import type { AdminProductListItem, ProductFilterParams } from '../../types/product';
import { getProductImageUrl, handleProductImageError } from '../../utils/productImages';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const ProductsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AdminProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isUrdu = i18n.language?.startsWith('ur');

  const fetchProducts = async () => {
    try {
      const filters: ProductFilterParams = {
        search: search.trim() || undefined,
        condition: conditionFilter,
        status: statusFilter,
        featured: featuredFilter,
      };

      const res = await productAdminService.getAdminProducts(filters);
      if (res.error) {
        setError(res.error.message);
      } else {
        setProducts(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query products from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [conditionFilter, statusFilter, featuredFilter]);

  // Handle Search submission or debounced trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchProducts();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const res = await productAdminService.deleteProduct(deleteCandidate.id);
      if (res.error) {
        setFeedbackMsg({ text: res.error.message, type: 'error' });
      } else {
        setFeedbackMsg({ text: t('products.deleteSuccess'), type: 'success' });
        // remove from local list immediately
        setProducts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Error deleting product record.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteCandidate(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('products.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('products.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl shadow-xs transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/products/bulk-images"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Upload multiple product images at once"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Bulk Images</span>
          </Link>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>{t('products.addProduct')}</span>
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="p-1 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Condition Filter */}
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as 'all' | 'new' | 'used')}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('products.allConditions')}</option>
              <option value="new">{t('products.new')}</option>
              <option value="used">{t('products.used')}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('products.allStatuses')}</option>
              <option value="active">{t('products.active')}</option>
              <option value="inactive">{t('products.inactive')}</option>
            </select>

            {/* Featured Filter */}
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'featured' | 'standard')}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('products.allFeatured')}</option>
              <option value="featured">{t('products.featured')}</option>
              <option value="standard">{t('products.standard')}</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Main Content: Table or States */}
      {loading ? (
        <LoadingState message="Loading catalog inventory from PostgreSQL..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Products"
          message={error}
          onRetry={fetchProducts}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title={
            search.trim() || conditionFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all'
              ? 'No Matching Products'
              : t('products.noProducts')
          }
          message={
            search.trim() || conditionFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all'
              ? 'No products match your current search and filter criteria.'
              : t('products.noProductsDesc')
          }
          icon={<Smartphone className="w-8 h-8 text-blue-600" />}
          actionText={
            search.trim() || conditionFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all'
              ? 'Clear Filters'
              : t('products.addProduct')
          }
          onAction={
            search.trim() || conditionFilter !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all'
              ? () => {
                  setSearch('');
                  setConditionFilter('all');
                  setStatusFilter('all');
                  setFeaturedFilter('all');
                }
              : () => navigate('/admin/products/new')
          }
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-16">{t('products.tableImage')}</th>
                  <th className="py-3.5 px-4">{t('products.tableName')}</th>
                  <th className="py-3.5 px-4">{t('products.tableBrand')}</th>
                  <th className="py-3.5 px-4">{t('products.tableCategory')}</th>
                  <th className="py-3.5 px-4">{t('products.filterCondition')}</th>
                  <th className="py-3.5 px-4">{t('products.tablePrice')}</th>
                  <th className="py-3.5 px-4">{t('products.tableStock')}</th>
                  <th className="py-3.5 px-4">{t('products.tableStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('products.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Primary Image */}
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                        <img
                          src={getProductImageUrl(p)}
                          alt={p.name_en}
                          onError={handleProductImageError}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{p.name_en}</div>
                      {p.name_ur && (
                        <div className="text-[11px] font-urdu text-slate-500 line-clamp-1">
                          {p.name_ur}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.is_featured && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            Featured
                          </span>
                        )}
                        {p.pta_status && (
                          <span className="text-[10px] font-medium text-slate-500">
                            {p.pta_status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.brands?.name || '—'}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {isUrdu ? p.categories?.name_ur || p.categories?.name_en || '—' : p.categories?.name_en || '—'}
                    </td>

                    {/* Condition */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.condition === 'new'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.condition === 'new' ? t('products.new') : t('products.used')}
                      </span>
                    </td>

                    {/* Price & Sale Price */}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900">
                        PKR {Number(p.price).toLocaleString()}
                      </div>
                      {p.sale_price !== null && p.sale_price !== undefined && (
                        <div className="text-[11px] text-emerald-600 font-semibold line-through">
                          PKR {Number(p.sale_price).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.stock_qty > 0
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {p.stock_qty}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {p.is_active ? t('products.active') : t('products.inactive')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/product/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View on store"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(p)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Total: <strong>{products.length}</strong> products</span>
            <span className="font-mono text-[11px]">Real Supabase Data</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('products.deleteConfirmTitle')}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {t('products.deleteConfirmMsg')}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl mb-6 text-xs text-slate-800 font-bold border border-slate-200">
              {deleteCandidate.name_en}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                {t('products.form.cancel')}
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('products.deleteProduct')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
