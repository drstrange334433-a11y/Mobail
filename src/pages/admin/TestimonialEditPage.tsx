import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TestimonialForm } from '../../components/admin/TestimonialForm';
import { testimonialAdminService } from '../../services/testimonialAdminService';
import type { Testimonial } from '../../types/database';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

export const TestimonialEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language?.startsWith('ur');
  const BackIcon = isUrdu ? ArrowRight : ArrowLeft;

  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTestimonial = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    const res = await testimonialAdminService.getTestimonialById(id);

    if (res.error) {
      setError(res.error.message);
      setTestimonial(null);
    } else if (!res.testimonial) {
      setError('Testimonial record not found.');
      setTestimonial(null);
    } else {
      setTestimonial(res.testimonial);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadTestimonial();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading testimonial details from database..." minHeight="min-h-[250px]" />
      </div>
    );
  }

  if (error || !testimonial) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12">
        <Link
          to="/admin/testimonials"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <BackIcon className="w-3.5 h-3.5" />
          <span>{t('testimonials.form.backToList')}</span>
        </Link>
        <ErrorState
          title="Testimonial Not Found"
          message={error || 'Unable to locate the requested testimonial in Supabase database.'}
          onRetry={loadTestimonial}
        />
      </div>
    );
  }

  return <TestimonialForm initialData={testimonial} isEditMode={true} />;
};
