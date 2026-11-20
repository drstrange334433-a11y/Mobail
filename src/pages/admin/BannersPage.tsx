import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ImageIcon, 
  RefreshCw, 
  AlertTriangle, 
  X,
  Calendar,
  Check,
  Eye,
  ExternalLink,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import type { AdminBannerListItem, BannerFilterParams } from '../../types/banner';
import { bannerAdminService } from '../../services/bannerAdminService';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';

export const BannersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isUrdu = i18n.language?.startsWith('ur');

  // State
  const [banners, setBanners] = useState<AdminBannerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Deletion modal state
  const [bannerToDelete, setBannerToDelete] = useState<AdminBannerListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);

    const filters: BannerFilterParams = {
      search: searchTerm.trim() || undefined,
      status: statusFilter,
    };

    const res = await bannerAdminService.getAdminBanners(filters);

    if (res.error) {
      setError(res.error.message);
      setBanners([]);
    } else {
      setBanners(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, [statusFilter]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBanners();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Status toggle handler
  const handleToggleStatus = async (banner: AdminBannerListItem) => {
    const res = await bannerAdminService.toggleBannerStatus(banner.id, banner.is_active);
    if (res.error) {
      showToast(`Failed to update status: ${res.error.message}`);
    } else {
      showToast(t('banners.toggleSuccess'));
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      );
    }
  };

  // Open delete confirm
  const handleOpenDelete = (banner: AdminBannerListItem) => {
    setBannerToDelete(banner);
    setDeleteError(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await bannerAdminService.deleteBanner(bannerToDelete.id);

    if (res.error) {
      setDeleteError(res.error.message);
      setIsDeleting(false);
    } else {
      setIsDeleting(false);
      setBannerToDelete(null);
      showToast(t('banners.deleteSuccess'));
      fetchBanners();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('banners.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('banners.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBanners()}
            disabled={isLoading}
            className="p-2.5 text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-xs disabled:opacity-50"
            title="Refresh banner list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/admin/banners/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="w-4 h-4" />
            <span>{t('banners.addBanner')}</span>
          </Link>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('banners.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            {t('banners.filterStatus')}:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('banners.allStatuses')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('banners.active')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('banners.inactive')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState message="Loading banners from database..." minHeight="min-h-[300px]" />
      ) : error ? (
        <ErrorState
          title="Failed to Load Banners"
          message={error}
          onRetry={fetchBanners}
        />
      ) : banners.length === 0 ? (
        <EmptyState
          title={searchTerm.trim() || statusFilter !== 'all' ? 'No Matching Banners' : t('banners.noBanners')}
          message={
            searchTerm.trim() || statusFilter !== 'all'
              ? 'No promotional banners match your current search and status filter.'
              : t('banners.noBannersDesc')
          }
          icon={<ImageIcon className="w-8 h-8 text-blue-600" />}
          actionText={searchTerm.trim() || statusFilter !== 'all' ? 'Clear Filters' : t('banners.addBanner')}
          onAction={
            searchTerm.trim() || statusFilter !== 'all'
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }
              : () => navigate('/admin/banners/new')
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                banner.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-85'
              }`}
            >
              {/* Image Banner Header */}
              <div>
                <div className="relative aspect-16/7 bg-slate-900 overflow-hidden group">
                  <img
                    src={banner.image_url}
                    alt={banner.title_en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        banner.is_active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {banner.is_active ? t('banners.active') : t('banners.inactive')}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      #{banner.sort_order}
                    </span>
                  </div>

                  {banner.button_link && (
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-white/90 text-slate-900 font-medium px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {banner.button_link}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content details */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {banner.title_en}
                    </h3>
                    <p className="text-xs text-slate-700 font-urdu leading-normal mt-0.5 line-clamp-1" dir="rtl">
                      {banner.title_ur}
                    </p>
                  </div>

                  {(banner.subtitle_en || banner.subtitle_ur) && (
                    <div className="text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100 pt-2">
                      {banner.subtitle_en && (
                        <p className="line-clamp-1">{banner.subtitle_en}</p>
                      )}
                      {banner.subtitle_ur && (
                        <p className="font-urdu text-slate-600 line-clamp-1" dir="rtl">
                          {banner.subtitle_ur}
                        </p>
                      )}
                    </div>
                  )}

                  {(banner.button_text_en || banner.button_text_ur) && (
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400 font-medium">Button:</span>
                      <span className="font-semibold text-blue-600">
                        {banner.button_text_en || banner.button_text_ur}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions footer */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(banner)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                    title={banner.is_active ? 'Deactivate banner' : 'Activate banner'}
                  >
                    {banner.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(banner.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/admin/banners/${banner.id}/edit`}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(banner)}
                    className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {t('banners.deleteConfirmTitle')}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {t('banners.deleteConfirmMsg')}
                </p>
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block">
                    {bannerToDelete.title_en}
                  </span>
                  <span className="text-slate-500 font-urdu block mt-0.5" dir="rtl">
                    {bannerToDelete.title_ur}
                  </span>
                </div>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBannerToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {t('banners.form.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : t('banners.deleteConfirmTitle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
