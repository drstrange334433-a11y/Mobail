import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Phase2PlaceholderProps {
  moduleName: string;
  description: string;
}

export const Phase2Placeholder: React.FC<Phase2PlaceholderProps> = ({ moduleName, description }) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Layers className="w-8 h-8" />
        </div>
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          Phase 2 Target Module
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {moduleName} Management
        </h2>
        <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
          {description}
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-xs text-slate-600 mb-8 text-left">
          <h4 className="font-semibold text-slate-900 mb-1">Architecture Ready:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>PostgreSQL schema & RLS policies configured</li>
            <li>Database service layer prepared</li>
            <li>Supabase Storage bucket foundation ready</li>
            <li>Interactive CRUD and modal forms activate in Phase 2</li>
          </ul>
        </div>

        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
