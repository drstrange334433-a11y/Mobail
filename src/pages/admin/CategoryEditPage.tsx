import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CategoryForm } from '../../components/admin/CategoryForm';
import { categoryAdminService } from '../../services/categoryAdminService';
import type { Category } from '../../types/database';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const CategoryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  const fetchCategory = async () => {
    if (!id) {
      setError('Category ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await categoryAdminService.getAdminCategory(id);
      if (res.error) {
        setError(res.error.message);
      } else if (!res.data) {
        setError('Category not found in database.');
      } else {
        setCategory(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve category.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading category from PostgreSQL..." />;
  }

  if (error || !category) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Could Not Load Category"
          message={error || 'Category not found.'}
          onRetry={fetchCategory}
        />
        <div className="text-center mt-6">
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <BackIcon className="w-4 h-4" />
            <span>{t('categories.form.backToList')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return <CategoryForm initialData={category} isEditMode={true} />;
};
