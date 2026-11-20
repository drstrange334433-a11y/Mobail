import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BrandForm } from '../../components/admin/BrandForm';
import { brandAdminService } from '../../services/brandAdminService';
import type { Brand } from '../../types/database';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const BrandEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  const fetchBrand = async () => {
    if (!id) {
      setError('Brand ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await brandAdminService.getAdminBrand(id);
      if (res.error) {
        setError(res.error.message);
      } else if (!res.data) {
        setError('Brand not found in database.');
      } else {
        setBrand(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve brand.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading brand from PostgreSQL..." />;
  }

  if (error || !brand) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Could Not Load Brand"
          message={error || 'Brand not found.'}
          onRetry={fetchBrand}
        />
        <div className="text-center mt-6">
          <Link
            to="/admin/brands"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <BackIcon className="w-4 h-4" />
            <span>{t('brands.form.backToList')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return <BrandForm initialData={brand} isEditMode={true} />;
};
