/**
 * Ce fichier définit le composant PartenairesGrid.
 * Son rôle est d'afficher une grille de logos de partenaires.
 * Il récupère la liste des partenaires via le contexte `usePartners`,
 * charge les logos depuis Firebase Storage, et gère l'affichage d'un
 * placeholder si un logo est manquant. Au clic sur un partenaire,
 * il ouvre un panneau latéral (drawer) avec les détails du partenaire.
 */
'use client';

import { useState, useEffect } from 'react';
import { usePartners } from '../../contexts/PartnerContext';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

/**
 * Composant principal qui affiche la grille des partenaires.
 * Il gère l'état de chargement, l'affichage des partenaires ou d'un message si aucun partenaire n'est trouvé.
 * @returns {JSX.Element} Le composant React représentant la grille des partenaires.
 */
export default function PartenairesGrid() {
  const {
    filteredPartners,
    setSelectedPartner,
    setIsDrawerOpen,
    isLoading
  } = usePartners();

  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState(false);

  /**
   * Gère le clic sur la carte d'un partenaire.
   * Met à jour le partenaire sélectionné dans le contexte et ouvre le panneau de détails.
   * @param {any} partner - L'objet partenaire sur lequel l'utilisateur a cliqué.
   */
  const handlePartnerClick = (partner: any) => {
    setSelectedPartner(partner);
    setIsDrawerOpen(true);
  };

  /**
   * Affiche un placeholder pour les partenaires qui n'ont pas de logo.
   * Le placeholder est un cercle gris contenant la première lettre du nom du partenaire.
   * @param {any} partner - L'objet partenaire pour lequel afficher le placeholder.
   * @returns {JSX.Element} Le composant React du placeholder.
   */
  const renderPlaceholder = (partner: any) => (
    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
      {partner.SH_Display_Name_FR.charAt(0).toUpperCase()}
    </div>
  );

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