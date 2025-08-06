// app/components/Partenaires/PartnersTitle.tsx

/**
 * @file Ce fichier définit le composant React `PartnersTitle`.
 * Ce composant a pour rôle d'afficher le titre principal de la page des partenaires.
 * Il inclut également un badge dynamique qui indique le nombre total de partenaires,
 * et met à jour ce décompte pour montrer le nombre de résultats lorsqu'un filtre est appliqué.
 */

'use client';

import { useTranslation } from '../../contexts/LanguageContext';

interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Display_Name_EN?: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string[];
}

interface PartnersTitleProps {
  partners: Partner[];
  filteredPartners: Partner[];
}

/**
 * Affiche le titre de la section des partenaires ainsi qu'un badge
 * indiquant le nombre de partenaires affichés par rapport au total.
 * VERSION 2024 : Reçoit les données des partenaires via props du composant parent.
 * @param {PartnersTitleProps} props - Les propriétés reçues du parent
 * @returns {JSX.Element} Le composant JSX représentant le titre.
 */
export default function PartnersTitle({ partners, filteredPartners }: PartnersTitleProps) {
  const { t } = useTranslation();
  const totalCount = partners?.length || 0;
  const filteredCount = filteredPartners?.length || 0;
  const isFiltered = totalCount !== filteredCount && filteredCount > 0;

  return (
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-bold text-gray-900">{t('partners.title.main')}</h1>

      <div className="flex items-center">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {isFiltered ? `${filteredCount} ${t('common.on')} ${totalCount}` : totalCount}
        </span>
      </div>
    </div>
  );
}