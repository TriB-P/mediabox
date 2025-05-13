'use client';

import { usePartners } from '../contexts/PartnerContext';
import PartnerDrawer from './PartnerDrawer';

export default function DrawerContainer() {
  const { selectedPartner, isDrawerOpen, setIsDrawerOpen } = usePartners();
  
  return (
    <PartnerDrawer
      isOpen={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      partner={selectedPartner}
    />
  );
}