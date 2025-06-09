'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  SmartSelect, 
  createLabelWithHelp 
} from './TactiqueFormComponents';

// ==================== TYPES ====================

interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

interface TactiqueFormInfoProps {
  // Données du formulaire
  formData: {
    TC_Label?: string;
    TC_Budget?: number;
    TC_Order?: number;
    TC_Status?: string;
    TC_StartDate?: string;
    TC_EndDate?: string;
    TC_Bucket?: string;
  };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Données externes
  buckets: CampaignBucket[];
  
  // État de chargement
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TactiqueFormInfo = memo<TactiqueFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  buckets,
  loading = false
}) => {
  // Options pour le statut
  const statusOptions = [
    { id: 'Planned', label: 'Planifié' },
    { id: 'Active', label: 'Actif' },
    { id: 'Completed', label: 'Terminé' },
    { id: 'Cancelled', label: 'Annulé' },
  ];

  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Informations générales
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration de base de la tactique
        </p>
      </div>
      
      {/* Champs du formulaire */}
      <div className="space-y-6">
        
        {/* TC_Label - Champ obligatoire */}
        <FormInput
          id="TC_Label"
          name="TC_Label"
          value={formData.TC_Label || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: Bannières Display Google"
          required={!isDisabled}
          label={createLabelWithHelp(
            'Étiquette *', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

       
        {/* TC_Bucket - Seulement si des buckets sont disponibles */}
        {buckets.length > 0 && (
          <SmartSelect
            id="TC_Bucket"
            name="TC_Bucket"
            value={formData.TC_Bucket || ''}
            onChange={onChange}
            options={buckets.map(bucket => ({ 
              id: bucket.id, 
              label: bucket.name 
            }))}
            placeholder="Sélectionner une enveloppe..."
            label={createLabelWithHelp(
              'Enveloppe', 
              'Liste des buckets dans la campagne. Une sélection possible', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Order - Champ caché pour l'ordre */}
        <input
          type="hidden"
          name="TC_Order"
          value={formData.TC_Order || 0}
          onChange={onChange}
        />
      </div>

      {/* Message d'information si en chargement */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données...</p>
        </div>
      )}

      {/* Message d'information si aucun bucket */}
      {buckets.length === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
          <p className="text-sm">
            Aucune enveloppe budgétaire définie pour cette campagne. 
            Vous pouvez créer des enveloppes dans la section Stratégie.
          </p>
        </div>
      )}
    </div>
  );
});

TactiqueFormInfo.displayName = 'TactiqueFormInfo';

export default TactiqueFormInfo;