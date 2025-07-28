// app/components/TactiqueFormInfo.tsx
/**
 * Ce fichier définit le composant React `TactiqueFormInfo`.
 * Il s'agit d'une section de formulaire dédiée à la saisie des informations générales d'une "tactique".
 * Ce composant est "pur" (présentationnel) : il reçoit l'état du formulaire et les fonctions pour le modifier via ses props,
 * mais ne gère pas l'état lui-même. Il affiche les champs pour l'étiquette, l'enveloppe budgétaire et gère l'état de chargement.
 */
'use client';

import React, { memo } from 'react';
import {
  FormInput,
  SmartSelect,
  createLabelWithHelp
} from './TactiqueFormComponents';

interface CampaignBucket {
  id: string;
  name: string;
  description?: string;
  target: number;
  color?: string;
}

interface TactiqueFormInfoProps {
  formData: {
    TC_Label?: string;
    TC_Budget?: number;
    TC_Order?: number;
    TC_Status?: string;
    TC_StartDate?: string;
    TC_EndDate?: string;
    TC_Bucket?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  buckets: CampaignBucket[];
  loading?: boolean;
}

/**
 * Affiche la section "Informations générales" du formulaire de création/édition d'une tactique.
 * Ce composant est optimisé avec `React.memo` pour éviter les rendus inutiles.
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles des champs du formulaire.
 * @param {Function} props.onChange - La fonction de rappel à exécuter lorsqu'un champ du formulaire change.
 * @param {Function} props.onTooltipChange - La fonction de rappel pour afficher une infobulle d'aide.
 * @param {CampaignBucket[]} props.buckets - La liste des enveloppes budgétaires disponibles pour la campagne.
 * @param {boolean} [props.loading=false] - Un booléen indiquant si les données sont en cours de chargement. Si true, les champs sont désactivés.
 * @returns {JSX.Element} Le JSX représentant la section du formulaire.
 */
const TactiqueFormInfo = memo<TactiqueFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  buckets,
  loading = false
}) => {
  const statusOptions = [
    { id: 'Planned', label: 'Planifié' },
    { id: 'Active', label: 'Actif' },
    { id: 'Completed', label: 'Terminé' },
    { id: 'Cancelled', label: 'Annulé' },
  ];

  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Informations générales
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration de base de la tactique
        </p>
      </div>

      <div className="space-y-6">
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
            "C'est le nom de votre tactique. Assurez-vous de mettre une description claire et concise.",
            onTooltipChange
          )}
        />

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
              "Les enveloppes sont un outil de planification haut niveau. Elles vous permettent de regrouper des tactiques similaires et de suivre leur budget global dans l'onglet 'Stratégie'",
              onTooltipChange
            )}
          />
        )}

        <input
          type="hidden"
          name="TC_Order"
          value={formData.TC_Order || 0}
          onChange={onChange}
        />
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">Chargement des données...</p>
        </div>
      )}

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