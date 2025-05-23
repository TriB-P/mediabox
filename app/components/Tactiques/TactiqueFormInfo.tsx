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

        {/* TC_Budget */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            {createLabelWithHelp(
              'Budget', 
              'Montant alloué à cette tactique en CAD', 
              onTooltipChange
            )}
          </div>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="TC_Budget"
              name="TC_Budget"
              value={formData.TC_Budget || ''}
              onChange={onChange}
              min="0"
              step="0.01"
              disabled={isDisabled}
              className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* TC_Status */}
        <SmartSelect
          id="TC_Status"
          name="TC_Status"
          value={formData.TC_Status || ''}
          onChange={onChange}
          options={statusOptions}
          placeholder="Sélectionner un statut..."
          label={createLabelWithHelp(
            'Statut', 
            'État actuel de la tactique dans son cycle de vie', 
            onTooltipChange
          )}
        />

        {/* TC_StartDate */}
        <FormInput
          id="TC_StartDate"
          name="TC_StartDate"
          value={formData.TC_StartDate || ''}
          onChange={onChange}
          type="date"
          label={createLabelWithHelp(
            'Date de début', 
            'Date de début de diffusion de la tactique', 
            onTooltipChange
          )}
        />

        {/* TC_EndDate */}
        <FormInput
          id="TC_EndDate"
          name="TC_EndDate"
          value={formData.TC_EndDate || ''}
          onChange={onChange}
          type="date"
          label={createLabelWithHelp(
            'Date de fin', 
            'Date de fin de diffusion de la tactique', 
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