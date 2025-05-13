'use client';

import { usePartners } from '../contexts/PartnerContext';
import Image from 'next/image';

export default function PartenairesGrid() {
  const { 
    filteredPartners, 
    setSelectedPartner, 
    setIsDrawerOpen, 
    isLoading 
  } = usePartners();

  const handlePartnerClick = (partner: any) => {
    setSelectedPartner(partner);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (filteredPartners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-gray-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.2-5.2m2.2-2.8a8 8 0 11-15.4-3 8 8 0 0115.4 3z" />
          </svg>
          <h3 className="text-lg font-medium">Aucun partenaire trouvé</h3>
          <p className="mt-1">Essayez de modifier vos critères de recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filteredPartners.map(partner => (
        <div
          key={partner.id}
          className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handlePartnerClick(partner)}
        >
          <div className="h-24 w-full flex items-center justify-center mb-3 relative">
            {partner.SH_Logo ? (
              <Image
                src={partner.SH_Logo}
                alt={partner.SH_Display_Name_FR}
                className="object-contain"
                fill
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                {partner.SH_Display_Name_FR.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-center text-gray-900 mt-2">
            {partner.SH_Display_Name_FR}
          </p>
          {partner.SH_Type && (
            <p className="text-xs text-gray-500 mt-1">
              {partner.SH_Type}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}