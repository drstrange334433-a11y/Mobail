import React from 'react';
import { BannerForm } from '../../components/admin/BannerForm';

export const BannerCreatePage: React.FC = () => {
  return <BannerForm isEditMode={false} />;
};
