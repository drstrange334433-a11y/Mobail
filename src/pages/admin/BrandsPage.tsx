import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag, 
  RefreshCw, 
  AlertTriangle, 
  X,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { brandAdminService } from '../../services/brandAdminService';
import type { AdminBrandListItem, BrandFilterParams } from '../../types/brand';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const BrandsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<AdminBrandListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AdminBrandListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isUrdu = i18n.language?.startsWith('ur');

  const fetchBrands = async () => {
    try {
      const filters: BrandFilterParams = {
        search: search.trim() || undefined,
        status: statusFilter,
      };

      const res = await brandAdminService.getAdminBrands(filters);
      if (res.error) {
        setError(res.error.message);
      } else {
        setBrands(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query brands.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchBrands();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBrands();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;

    // Safety check: verify product assignment
    if ((deleteCandidate.product_count ?? 0) > 0) {
      setFeedbackMsg({
        text: `Cannot delete: "${deleteCandidate.name}" is assigned to ${deleteCandidate.product_count} product(s). Please reassign products first.`,
        type: 'error',
      });
      setDeleteCandidate(null);
      return;
    }

    setDeleting(true);
    try {
      const res = await brandAdminService.deleteBrand(deleteCandidate.id);
      if (res.error) {
        setFeedbackMsg({ text: res.error.message, type: 'error' });
      } else {
        setFeedbackMsg({ text: t('brands.deleteSuccess'), type: 'success' });
        setBrands((prev) => prev.filter((b) => b.id !== deleteCandidate.id));
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Error deleting brand record.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteCandidate(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t('brands.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('brands.subtitle')}
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
            to="/admin/brands/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>{t('brands.addBrand')}</span>
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
              placeholder={t('brands.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('brands.allStatuses')}</option>
              <option value="active">{t('brands.active')}</option>
              <option value="inactive">{t('brands.inactive')}</option>
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

      {/* Main Content */}
      {loading ? (
        <LoadingState message="Loading brands from PostgreSQL..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Brands"
          message={error}
          onRetry={fetchBrands}
        />
      ) : brands.length === 0 ? (
        <EmptyState
          title={search.trim() || statusFilter !== 'all' ? 'No Matching Brands' : t('brands.noBrands')}
          message={
            search.trim() || statusFilter !== 'all'
              ? 'No brands match your search and filter criteria.'
              : t('brands.noBrandsDesc')
          }
          icon={<Tag className="w-8 h-8 text-blue-600" />}
          actionText={search.trim() || statusFilter !== 'all' ? 'Clear Filters' : t('brands.addBrand')}
          onAction={
            search.trim() || statusFilter !== 'all'
              ? () => {
                  setSearch('');
                  setStatusFilter('all');
                }
              : () => navigate('/admin/brands/new')
          }
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-16">{t('brands.tableLogo')}</th>
                  <th className="py-3.5 px-4">{t('brands.tableName')}</th>
                  <th className="py-3.5 px-4 text-center">{t('brands.tableProducts')}</th>
                  <th className="py-3.5 px-4 text-center">{t('brands.tableSort')}</th>
                  <th className="py-3.5 px-4">{t('brands.tableStatus')}</th>
                  <th className="py-3.5 px-4">{t('brands.tableCreated')}</th>
                  <th className="py-3.5 px-4 text-right">{t('brands.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Logo */}
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-full h-full object-contain p-1.5"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </td>

                    {/* Brand Name */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 text-sm">{brand.name}</span>
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          (brand.product_count ?? 0) > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {brand.product_count ?? 0}
                      </span>
                    </td>

                    {/* Sort Order */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                      {brand.sort_order}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          brand.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            brand.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {brand.is_active ? t('brands.active') : t('brands.inactive')}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(brand.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/brands/${brand.id}/edit`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit brand"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(brand)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete brand"
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
            <span>Total: <strong>{brands.length}</strong> brands</span>
            <span className="font-mono text-[11px]">Real Supabase Data</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Safety Checks */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              (deleteCandidate.product_count ?? 0) > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('brands.deleteConfirmTitle')}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              {t('brands.deleteConfirmMsg')}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs text-slate-800 font-bold border border-slate-200">
              {deleteCandidate.name}
            </div>

            {/* Usage Warning Block */}
            {(deleteCandidate.product_count ?? 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900">
                <strong>Blocked: </strong>
                {t('brands.deleteWarningProducts', { count: deleteCandidate.product_count })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                {t('brands.form.cancel')}
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting || (deleteCandidate.product_count ?? 0) > 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('brands.deleteBrand')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
