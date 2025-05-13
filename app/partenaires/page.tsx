'use client';

import { PartnerProvider } from '../contexts/PartnerContext';
import PartenairesFilter from '../components/PartenairesFilter';
import PartenairesGrid from '../components/PartenairesGrid';
import DrawerContainer from '../components/DrawerContainer';

export default function PartenairesPage() {
  return (
    <PartnerProvider>
      <div className="p-6 flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-6">Partenaires</h1>
        
        <PartenairesFilter />
        <PartenairesGrid />
        <DrawerContainer />
      </div>
    </PartnerProvider>
  );
}