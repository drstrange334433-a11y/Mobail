import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProductForm } from '../../components/admin/ProductForm';
import { productAdminService } from '../../services/productAdminService';
import type { AdminProductDetail } from '../../types/product';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const ProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  const fetchProduct = async () => {
    if (!id) {
      setError('Product ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await productAdminService.getAdminProduct(id);
      if (res.error) {
        setError(res.error.message);
      } else if (!res.data) {
        setError('Product not found in the database.');
      } else {
        setProduct(res.data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading product information from PostgreSQL..." />;
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Could Not Load Product"
          message={error || 'Product not found.'}
          onRetry={fetchProduct}
        />
        <div className="text-center mt-6">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <BackIcon className="w-4 h-4" />
            <span>{t('products.form.backToList')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProductForm initialData={product} isEditMode={true} />;
};
