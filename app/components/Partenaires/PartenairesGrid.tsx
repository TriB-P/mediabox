// app/components/Partenaires/PartenairesGrid.tsx

/**
 * Ce fichier définit le composant PartenairesGrid.
 * Son rôle est d'afficher une grille de logos de partenaires.
 * Charge les logos depuis Firebase Storage et gère l'affichage d'un placeholder si manquant.
 * Au clic sur un partenaire, déclenche l'ouverture du panneau latéral via une fonction callback.
 * VERSION 2024.1 : Affiche les types de partenaires traduits selon la langue de l'interface.
 */
'use client';

import { useState, useEffect } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { translatePartnerType } from '../../lib/partnerTypeService';
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

interface PartenairesGridProps {
  filteredPartners: Partner[];
  isLoading: boolean;
  onPartnerClick: (partner: Partner) => void;
}

/**
 * Composant principal qui affiche la grille des partenaires.
 * Il gère l'état de chargement, l'affichage des partenaires ou d'un message si aucun partenaire n'est trouvé.
 * @param {PartenairesGridProps} props - Les propriétés reçues du parent
 * @returns {JSX.Element} Le composant React représentant la grille des partenaires.
 */
export default function PartenairesGrid({
  filteredPartners,
  isLoading,
  onPartnerClick
}: PartenairesGridProps) {
  const { t, language } = useTranslation();
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState(false);

  /**
   * Affiche un placeholder pour les partenaires qui n'ont pas de logo.
   * Le placeholder est un cercle gris contenant la première lettre du nom du partenaire.
   * @param {Partner} partner - L'objet partenaire pour lequel afficher le placeholder.
   * @returns {JSX.Element} Le composant React du placeholder.
   */
  const renderPlaceholder = (partner: Partner) => (
    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
      {partner.SH_Display_Name_FR.charAt(0).toUpperCase()}
    </div>
  );

  /**
   * Obtient le type de partenaire traduit selon la langue de l'interface
   * @param {Partner} partner - L'objet partenaire
   * @returns {string} Le type traduit ou une chaîne vide
   */
  const getDisplayType = (partner: Partner): string => {
    if (!partner.SH_Type) return '';
    return translatePartnerType(partner.SH_Type, language);
  };

  /**
   * Effet de bord pour charger les URLs des logos des partenaires depuis Firebase Storage.
   * S'exécute lorsque la liste des partenaires filtrés change ou que l'état de chargement principal se termine.
   * Il traite les chemins 'gs://' pour récupérer les URLs de téléchargement et utilise les URLs directes.
   */
  useEffect(() => {
    if (!isLoading && filteredPartners.length > 0) {
      const storage = getStorage();
      setLoadingImages(true);

      const loadImages = async () => {
        const urls: { [key: string]: string } = {};

        for (const partner of filteredPartners) {
          if (partner.SH_Logo) {
            try {
              if (partner.SH_Logo.startsWith('gs://')) {
                const storageRef = ref(storage, partner.SH_Logo);
                console.log(`FIREBASE: LECTURE - Fichier: PartenairesGrid.tsx - Fonction: loadImages - Path: ${partner.SH_Logo}`);
                const url = await getDownloadURL(storageRef);
                urls[partner.id] = url;
              } else {
                urls[partner.id] = partner.SH_Logo;
              }
            } catch (error) {
              console.error(`Erreur de chargement d'image pour ${partner.id}:`, error);
            }
          }
        }

        setImageUrls(urls);
        setLoadingImages(false);
      };

      loadImages();
    }
  }, [isLoading, filteredPartners]);

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
          <h3 className="text-lg font-medium">{t('partnersGrid.notFound.title')}</h3>
          <p className="mt-1">{t('partnersGrid.notFound.suggestion')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filteredPartners.map(partner => {
        const displayType = getDisplayType(partner);
        
        return (
          <div
            key={partner.id}
            className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onPartnerClick(partner)}
          >
            <div className="h-24 w-full flex items-center justify-center mb-3">
              {imageUrls[partner.id] ? (
                <div className="h-20 w-20 flex items-center justify-center">
                  <img
                    src={imageUrls[partner.id]}
                    alt={partner.SH_Display_Name_FR}
                    className="max-h-full max-w-full object-contain"
                    onError={() => {
                      setImageUrls(prev => {
                        const newUrls = { ...prev };
                        delete newUrls[partner.id];
                        return newUrls;
                      });
                    }}
                    loading="lazy"
                  />
                </div>
              ) : (
                renderPlaceholder(partner)
              )}
            </div>
            <p className="text-sm font-medium text-center text-gray-900 mt-2">
              {partner.SH_Display_Name_FR}
            </p>
            {displayType && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                {displayType}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}