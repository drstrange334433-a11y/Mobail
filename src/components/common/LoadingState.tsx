import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message, minHeight = 'min-h-[250px]' }) => {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${minHeight}`}>
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-600 font-medium text-sm">
        {message || t('common.loading')}
      </p>
    </div>
  );
};
