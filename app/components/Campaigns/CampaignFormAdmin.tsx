/**
 * @file Ce fichier définit le composant CampaignFormAdmin, un formulaire React.
 * Il est utilisé pour afficher et gérer les champs administratifs et de facturation
 * spécifiques à une campagne. Ce composant est purement visuel et délègue la gestion
 * de l'état et des actions aux composants parents via des props.
 */

'use client';

import React, { memo } from 'react';
import {
  FormInput,
  createLabelWithHelp,
  FormSection
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';

interface CampaignFormAdminProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  loading?: boolean;
}

/**
 * @function CampaignFormAdmin
 * @description Un composant React mémoïsé qui rend les champs de formulaire pour la section administrative d'une campagne.
 * @param {CampaignFormAdminProps} props - Les propriétés du composant.
 * @param {CampaignFormData} props.formData - L'objet contenant les données actuelles du formulaire.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - La fonction de rappel à exécuter lors de la modification d'un champ.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - La fonction pour afficher des infobulles d'aide.
 * @param {boolean} [props.loading=false] - Un booléen indiquant si le formulaire est en état de chargement, désactivant les champs si vrai.
 * @returns {React.ReactElement} Le JSX représentant la section administrative du formulaire de campagne.
 */
const CampaignFormAdmin = memo<CampaignFormAdminProps>(({
  formData,
  onChange,
  onTooltipChange,
  loading = false
}) => {
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title="Administration"
        description="Informations administratives et de facturation"
      >
        <div className="space-y-6">
          <FormInput
            id="CA_Client_Ext_Id"
            name="CA_Client_Ext_Id"
            value={formData.CA_Client_Ext_Id || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: CLI-2024-001"
            label={createLabelWithHelp(
              'ID externe client',
              'Identifiant du client dans vos systèmes externes (CRM, ERP, etc.)',
              onTooltipChange
            )}
          />

          <FormInput
            id="CA_PO"
            name="CA_PO"
            value={formData.CA_PO || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: PO-2024-12345"
            label={createLabelWithHelp(
              'Numéro de PO',
              'Numéro de bon de commande (Purchase Order) associé à cette campagne',
              onTooltipChange
            )}
          />

          <FormInput
            id="CA_Billing_ID"
            name="CA_Billing_ID"
            value={formData.CA_Billing_ID || ''}
            onChange={onChange}
            type="text"
            placeholder="Ex: BILL-2024-789"
            label={createLabelWithHelp(
              'ID Facturation',
              'Identifiant de facturation pour cette campagne dans votre système comptable',
              onTooltipChange
            )}
          />

        </div>
      </FormSection>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Conseil</h4>
        <p className="text-sm text-blue-700">
          Ces informations administratives sont optionnelles mais recommandées pour faciliter
          le suivi et la facturation de vos campagnes. Elles peuvent être définies au niveau
          du client et héritées par les tactiques.
        </p>
      </div>
    </div>
  );
});

CampaignFormAdmin.displayName = 'CampaignFormAdmin';

export default CampaignFormAdmin;