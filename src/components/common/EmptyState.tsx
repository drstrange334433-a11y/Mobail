import React from 'react';
import { useTranslation } from 'react-i18next';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  actionText,
  onAction,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white border border-slate-200/80 rounded-2xl max-w-lg mx-auto my-8 shadow-sm">
      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        {title || t('common.empty')}
      </h3>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-sm">
        {message || 'No records are currently available in this section.'}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
