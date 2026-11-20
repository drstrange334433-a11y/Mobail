import React from 'react';
import { ProductForm } from '../../components/admin/ProductForm';

export const ProductCreatePage: React.FC = () => {
  return <ProductForm isEditMode={false} />;
};
