import React, { useEffect, useState, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Star, 
  RefreshCw, 
  AlertTriangle, 
  X,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  User,
  Loader2
} from 'lucide-react';
import type { AdminTestimonialListItem, TestimonialFilterParams } from '../../types/testimonial';
import { testimonialAdminService } from '../../services/testimonialAdminService';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

export const TestimonialsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');
  const [, startTransition] = useTransition();

  // State
  const [testimonials, setTestimonials] = useState<AdminTestimonialListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState<AdminTestimonialListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    setError(null);
    const filters: TestimonialFilterParams = {
      search: searchTerm.trim() || undefined,
      status: statusFilter,
      rating: ratingFilter,
    };

    const res = await testimonialAdminService.getAdminTestimonials(filters);

    if (res.error) {
      setError(res.error.message);
    } else {
      setTestimonials(res.data);
    }

    setIsLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, [statusFilter, ratingFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      fetchTestimonials();
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTestimonials();
  };

  const handleToggleStatus = async (item: AdminTestimonialListItem) => {
    setTogglingId(item.id);
    setError(null);
    try {
      const res = await testimonialAdminService.toggleActiveStatus(item.id, item.is_active);
      if (res.error) {
        setError(`Failed to update status: ${res.error.message}`);
      } else if (res.testimonial) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, is_active: !t.is_active } : t))
        );
        setToastMessage(t('testimonials.toggleSuccess'));
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await testimonialAdminService.deleteTestimonial(itemToDelete.id);

    if (res.error) {
      setDeleteError(res.error.message);
      setIsDeleting(false);
    } else {
      setTestimonials((prev) => prev.filter((t) => t.id !== itemToDelete.id));
      setIsDeleting(false);
      setItemToDelete(null);
      setToastMessage(t('testimonials.deleteSuccess'));
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('testimonials.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {testimonials.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? t('common.loading') : 'Refresh'}</span>
          </button>

          <Link
            to="/admin/testimonials/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('testimonials.addTestimonial')}</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('testimonials.searchPlaceholder')}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            {t('common.search')}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
              {t('testimonials.filterStatus')}:
            </span>
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all'
                  ? t('testimonials.allStatuses')
                  : status === 'active'
                  ? t('testimonials.active')
                  : t('testimonials.inactive')}
              </button>
            ))}
          </div>

          {/* Rating Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
              {t('testimonials.filterRating')}:
            </span>
            <button
              type="button"
              onClick={() => setRatingFilter('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                ratingFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('testimonials.allRatings')}
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatingFilter(r)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  ratingFilter === r
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{r}</span>
                <Star className={`w-3 h-3 ${ratingFilter === r ? 'fill-white text-white' : 'text-amber-500 fill-amber-400'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {isLoading ? (
        <LoadingState message="Loading testimonials from database..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Testimonials"
          message={error}
          onRetry={fetchTestimonials}
        />
      ) : testimonials.length === 0 ? (
        <EmptyState
          title={
            searchTerm.trim() || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'No Matching Testimonials'
              : t('testimonials.noTestimonials')
          }
          message={
            searchTerm.trim() || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'No reviews match your current search and filter criteria.'
              : t('testimonials.noTestimonialsDesc')
          }
          icon={<Star className="w-8 h-8 text-amber-500" />}
          actionText={
            searchTerm.trim() || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'Clear Filters'
              : t('testimonials.addTestimonial')
          }
          onAction={
            searchTerm.trim() || statusFilter !== 'all' || ratingFilter !== 'all'
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRatingFilter('all');
                }
              : () => navigate('/admin/testimonials/new')
          }
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">{t('testimonials.tableCustomer')}</th>
                  <th className="py-3 px-4">{t('testimonials.tableRating')}</th>
                  <th className="py-3 px-4">{t('testimonials.tableReviewEn')}</th>
                  <th className="py-3 px-4">{t('testimonials.tableReviewUr')}</th>
                  <th className="py-3 px-4 text-center">{t('testimonials.tableStatus')}</th>
                  <th className="py-3 px-4">{t('testimonials.tableCreated')}</th>
                  <th className="py-3 px-4 text-right">{t('testimonials.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {testimonials.map((item) => {
                  const dateFormatted = new Date(item.created_at).toLocaleDateString('en-PK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Customer Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {item.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold">{item.customer_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{item.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                          <span>{item.rating}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        </div>
                      </td>

                      {/* English Review */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="line-clamp-2 text-slate-700 text-xs">
                          {item.review_en || <span className="text-slate-400 italic">None</span>}
                        </p>
                      </td>

                      {/* Urdu Review */}
                      <td className="py-3.5 px-4 max-w-[240px]" dir="rtl">
                        <p className="line-clamp-2 text-slate-700 text-xs font-sans text-right">
                          {item.review_ur || <span className="text-slate-400 italic">کوئی نہیں</span>}
                        </p>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                          title="Toggle active storefront visibility"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition-all disabled:opacity-60 cursor-pointer ${
                            item.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {togglingId === item.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                              <span>...</span>
                            </>
                          ) : item.is_active ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              <span>{t('testimonials.active')}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                              <span>{t('testimonials.inactive')}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {dateFormatted}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/testimonials/${item.id}/edit`}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title={t('testimonials.editTestimonial')}
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title={t('testimonials.deleteTestimonial')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {t('testimonials.deleteConfirmTitle')}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t('testimonials.deleteConfirmMsg')}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-800">{itemToDelete.customer_name}</span>
              <div className="flex items-center gap-1 text-amber-500 mt-1">
                <span>{itemToDelete.rating} / 5 stars</span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                {t('testimonials.form.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isDeleting && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : t('testimonials.deleteTestimonial')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
