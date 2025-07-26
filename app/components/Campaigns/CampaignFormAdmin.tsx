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
import { useTranslation } from '../../contexts/LanguageContext';

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
  const { t } = useTranslation();
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title={t('campaigns.formAdmin.title')}
        description={t('campaigns.formAdmin.description')}
      >
        <div className="space-y-6">
          <FormInput
            id="CA_Client_Ext_Id"
            name="CA_Client_Ext_Id"
            value={formData.CA_Client_Ext_Id || ''}
            onChange={onChange}
            type="text"
            placeholder={t('campaigns.formAdmin.extClientIdPlaceholder')}
            label={createLabelWithHelp(
              t('campaigns.formAdmin.extClientId'),
              t('campaigns.formAdmin.extClientIdHelp'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CA_PO"
            name="CA_PO"
            value={formData.CA_PO || ''}
            onChange={onChange}
            type="text"
            placeholder={t('campaigns.formAdmin.poNumberPlaceholder')}
            label={createLabelWithHelp(
              t('campaigns.formAdmin.poNumber'),
              t('campaigns.formAdmin.poNumberHelp'),
              onTooltipChange
            )}
          />

          <FormInput
            id="CA_Billing_ID"
            name="CA_Billing_ID"
            value={formData.CA_Billing_ID || ''}
            onChange={onChange}
            type="text"
            placeholder={t('campaigns.formAdmin.billingIdPlaceholder')}
            label={createLabelWithHelp(
              t('campaigns.formAdmin.billingId'),
              t('campaigns.formAdmin.billingIdHelp'),
              onTooltipChange
            )}
          />

        </div>
      </FormSection>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">{t('campaigns.formAdmin.tipTitle')}</h4>
        <p className="text-sm text-blue-700">
          {t('campaigns.formAdmin.tipText')}
        </p>
      </div>
    </div>
  );
});

CampaignFormAdmin.displayName = 'CampaignFormAdmin';

export default CampaignFormAdmin;