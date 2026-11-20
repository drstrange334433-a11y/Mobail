import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderTree, 
  RefreshCw, 
  AlertTriangle, 
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { categoryAdminService } from '../../services/categoryAdminService';
import type { AdminCategoryListItem, CategoryFilterParams } from '../../types/category';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const CategoriesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AdminCategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<AdminCategoryListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isUrdu = i18n.language?.startsWith('ur');

  const fetchCategories = async () => {
    try {
      const filters: CategoryFilterParams = {
        search: search.trim() || undefined,
        status: statusFilter,
      };

      const res = await categoryAdminService.getAdminCategories(filters);
      if (res.error) {
        setError(res.error.message);
      } else {
        setCategories(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchCategories();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;

    // Safety checks: products or children
    if ((deleteCandidate.product_count ?? 0) > 0) {
      setFeedbackMsg({
        text: `Cannot delete: this category is assigned to ${deleteCandidate.product_count} product(s). Please reassign products first.`,
        type: 'error',
      });
      setDeleteCandidate(null);
      return;
    }

    if ((deleteCandidate.children_count ?? 0) > 0) {
      setFeedbackMsg({
        text: `Cannot delete: this category has ${deleteCandidate.children_count} sub-category(ies). Please reassign or delete them first.`,
        type: 'error',
      });
      setDeleteCandidate(null);
      return;
    }

    setDeleting(true);
    try {
      const res = await categoryAdminService.deleteCategory(deleteCandidate.id);
      if (res.error) {
        setFeedbackMsg({ text: res.error.message, type: 'error' });
      } else {
        setFeedbackMsg({ text: t('categories.deleteSuccess'), type: 'success' });
        setCategories((prev) => prev.filter((c) => c.id !== deleteCandidate.id));
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Error deleting category record.',
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
            {t('categories.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('categories.subtitle')}
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
            to="/admin/categories/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>{t('categories.addCategory')}</span>
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
              placeholder={t('categories.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('categories.allStatuses')}</option>
              <option value="active">{t('categories.active')}</option>
              <option value="inactive">{t('categories.inactive')}</option>
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
        <LoadingState message="Loading categories from PostgreSQL..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Categories"
          message={error}
          onRetry={fetchCategories}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          title={search.trim() || statusFilter !== 'all' ? 'No Matching Categories' : t('categories.noCategories')}
          message={
            search.trim() || statusFilter !== 'all'
              ? 'No categories match your search and filter criteria.'
              : t('categories.noCategoriesDesc')
          }
          icon={<FolderTree className="w-8 h-8 text-blue-600" />}
          actionText={search.trim() || statusFilter !== 'all' ? 'Clear Filters' : t('categories.addCategory')}
          onAction={
            search.trim() || statusFilter !== 'all'
              ? () => {
                  setSearch('');
                  setStatusFilter('all');
                }
              : () => navigate('/admin/categories/new')
          }
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-14">{t('categories.tableIcon')}</th>
                  <th className="py-3.5 px-4">{t('categories.tableName')}</th>
                  <th className="py-3.5 px-4">{t('categories.tableSlug')}</th>
                  <th className="py-3.5 px-4">{t('categories.tableParent')}</th>
                  <th className="py-3.5 px-4 text-center">{t('categories.tableSort')}</th>
                  <th className="py-3.5 px-4 text-center">{t('categories.tableProducts')}</th>
                  <th className="py-3.5 px-4">{t('categories.tableStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('categories.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Icon */}
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {cat.icon_url ? (
                          <img
                            src={cat.icon_url}
                            alt={cat.name_en}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <FolderTree className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {cat.parent && (
                          <span className="text-slate-400 font-mono text-[11px]">↳</span>
                        )}
                        <span>{cat.name_en}</span>
                      </div>
                      {cat.name_ur && (
                        <div className="text-[11px] font-urdu text-slate-500">
                          {cat.name_ur}
                        </div>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {cat.slug}
                    </td>

                    {/* Parent Category */}
                    <td className="py-3 px-4 text-slate-800">
                      {cat.parent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 font-medium text-slate-700 text-[11px]">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{isUrdu ? cat.parent.name_ur : cat.parent.name_en}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None (Top-Level)</span>
                      )}
                    </td>

                    {/* Sort Order */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                      {cat.sort_order}
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          (cat.product_count ?? 0) > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.product_count ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cat.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cat.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {cat.is_active ? t('categories.active') : t('categories.inactive')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/categories/${cat.id}/edit`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit category"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(cat)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete category"
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
            <span>Total: <strong>{categories.length}</strong> categories</span>
            <span className="font-mono text-[11px]">Real Supabase Data</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Safety Checks */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              (deleteCandidate.product_count ?? 0) > 0 || (deleteCandidate.children_count ?? 0) > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('categories.deleteConfirmTitle')}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              {t('categories.deleteConfirmMsg')}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs text-slate-800 font-bold border border-slate-200">
              {deleteCandidate.name_en} {deleteCandidate.name_ur && `(${deleteCandidate.name_ur})`}
            </div>

            {/* Usage Warning Blocks */}
            {(deleteCandidate.product_count ?? 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900">
                <strong>Blocked: </strong>
                {t('categories.deleteWarningProducts', { count: deleteCandidate.product_count })}
              </div>
            )}

            {(deleteCandidate.children_count ?? 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-900">
                <strong>Blocked: </strong>
                {t('categories.deleteWarningChildren', { count: deleteCandidate.children_count })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                {t('categories.form.cancel')}
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={
                  deleting ||
                  (deleteCandidate.product_count ?? 0) > 0 ||
                  (deleteCandidate.children_count ?? 0) > 0
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('categories.deleteCategory')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
