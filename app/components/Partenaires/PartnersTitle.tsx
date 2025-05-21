'use client';

import { usePartners } from '../../contexts/PartnerContext';

export default function PartnersTitle() {
  const { partners, filteredPartners } = usePartners();
  
  // Vérifier si nous avons des partenaires et s'ils sont filtrés
  const totalCount = partners?.length || 0;
  const filteredCount = filteredPartners?.length || 0;
  const isFiltered = totalCount !== filteredCount && filteredCount > 0;

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-bold text-gray-900">Partenaires</h1>
      
      {/* Badge affichant le nombre de partenaires */}
      <div className="flex items-center">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {isFiltered 
            ? `${filteredCount} sur ${totalCount}`
            : totalCount
          }
        </span>
      </div>
    </div>
  );
}