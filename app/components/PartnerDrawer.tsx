'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Type pour les partenaires
interface Partner {
  id: string;
  SH_Code: string;
  SH_Display_Name_FR: string;
  SH_Default_UTM?: string;
  SH_Logo?: string;
  SH_Type?: string;
  SH_Tags?: string | string[]; // Peut être une chaîne ou un tableau
}

interface PartnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
}

export default function PartnerDrawer({ isOpen, onClose, partner }: PartnerDrawerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Effet pour charger l'image lorsqu'un nouveau partenaire est sélectionné
  useEffect(() => {
    if (partner && partner.SH_Logo) {
      setImageLoading(true);
      setImageError(false);
      setImageUrl(null);

      const loadImage = async () => {
        try {
          const storage = getStorage();
          
          if (partner.SH_Logo?.startsWith('gs://')) {
            // Si c'est une référence de stockage Firebase (gs://)
            const storageRef = ref(storage, partner.SH_Logo);
            const url = await getDownloadURL(storageRef);
            setImageUrl(url);
          } else {
            // Si c'est déjà une URL HTTP(S), l'utiliser directement
            setImageUrl(partner.SH_Logo);
          }
        } catch (error) {
          console.error('Erreur de chargement de l\'image:', error);
          setImageError(true);
        } finally {
          setImageLoading(false);
        }
      };

      loadImage();
    }
  }, [partner]);

  // Fonction pour convertir SH_Tags en tableau s'il s'agit d'une chaîne
  const getTagsArray = (tags: string | string[] | undefined): string[] => {
    if (!tags) return [];
    
    // Si c'est déjà un tableau, on le retourne tel quel
    if (Array.isArray(tags)) return tags;
    
    // Si c'est une chaîne, on la découpe et on nettoie les éléments
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  if (!isOpen || !partner) return null;

  // Obtenir le tableau de tags
  const tagsArray = getTagsArray(partner.SH_Tags);

  // Fonction pour rendre le placeholder
  const renderPlaceholder = () => (
    <div className="h-40 w-40 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500">
      {partner.SH_Display_Name_FR.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{partner.SH_Display_Name_FR}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative h-40 w-40 flex items-center justify-center">
              {imageLoading ? (
                <div className="animate-pulse h-40 w-40 bg-gray-200 rounded-lg"></div>
              ) : imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={partner.SH_Display_Name_FR}
                  className="max-h-full max-w-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                renderPlaceholder()
              )}
            </div>
          </div>
          
          {/* Informations */}
          <div className="space-y-6">
            <InfoItem label="Code" value={partner.SH_Code} />
            <InfoItem label="Nom" value={partner.SH_Display_Name_FR} />
            <InfoItem label="UTM par défaut" value={partner.SH_Default_UTM || '-'} />
            <InfoItem label="Type" value={partner.SH_Type || '-'} />
            
            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tagsArray.length > 0 ? (
                  tagsArray.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Aucun tag</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant d'élément d'information
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{label}</h3>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  );
}