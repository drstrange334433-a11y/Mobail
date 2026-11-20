import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BannerForm } from '../../components/admin/BannerForm';
import { bannerAdminService } from '../../services/bannerAdminService';
import type { Banner } from '../../types/database';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const BannerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  const [banner, setBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBanner = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    const res = await bannerAdminService.getBannerById(id);

    if (res.error) {
      setError(res.error.message);
      setBanner(null);
    } else if (!res.banner) {
      setError('Banner not found.');
      setBanner(null);
    } else {
      setBanner(res.banner);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadBanner();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading banner details..." minHeight="min-h-[250px]" />
      </div>
    );
  }

  if (error || !banner) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12">
        <Link
          to="/admin/banners"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>{t('banners.backToList')}</span>
        </Link>
        <ErrorState
          title="Banner Not Found"
          message={error || 'Unable to locate the requested banner record in Supabase database.'}
          onRetry={loadBanner}
        />
      </div>
    );
  }

  return <BannerForm initialData={banner} isEditMode={true} />;
};
