import React from 'react';
import { CategoryForm } from '../../components/admin/CategoryForm';

export const CategoryCreatePage: React.FC = () => {
  return <CategoryForm isEditMode={false} />;
};
