// components/admin/TactiqueFormAdmin.tsx
/**
 * @file Ce fichier contient les composants React nécessaires pour afficher la section "Administration"
 * du formulaire de création ou d'édition d'une tactique.
 * Il gère les champs liés à la facturation et au numéro de bon de commande (PO),
 * avec une fonctionnalité permettant d'hériter ces valeurs depuis la campagne parente
 * ou de les spécifier manuellement.
 */

'use client';

import React, { memo, useCallback } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';
import { useTranslation } from '../../../contexts/LanguageContext';

interface CampaignAdminValues {
  CA_Billing_ID?: string;
  CA_PO?: string;
}

interface TactiqueFormAdminProps {
  formData: {
    TC_Billing_ID?: string;
    TC_PO?: string;
  };
  useInheritedBilling: boolean;
  useInheritedPO: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  onInheritedBillingChange: (useInherited: boolean) => void;
  onInheritedPOChange: (useInherited: boolean) => void;
  campaignAdminValues: CampaignAdminValues;
  loading?: boolean;
}

/**
 * @component AdminField
 * @description Un composant de champ de formulaire réutilisable qui gère la logique d'héritage.
 * Il peut afficher soit une valeur héritée (non modifiable), soit un champ de saisie pour une valeur spécifique.
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.id - L'identifiant unique pour le champ de saisie et la checkbox.
 * @param {string} props.name - Le nom du champ de saisie, utilisé pour les formulaires.
 * @param {string} props.label - L'étiquette affichée au-dessus du champ.
 * @param {string} props.tooltip - Le texte d'aide affiché dans une infobulle.
 * @param {string} props.value - La valeur actuelle du champ (si l'héritage est désactivé).
 * @param {string} props.inheritedValue - La valeur héritée de la campagne parente.
 * @param {boolean} props.useInherited - Un booléen indiquant si le champ doit utiliser la valeur héritée.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - La fonction à appeler lors de la modification de la valeur du champ.
 * @param {(useInherited: boolean) => void} props.onInheritedChange - La fonction à appeler lorsque l'état d'héritage change (via la checkbox).
 * @param {(tooltip: string | null) => void} props.onTooltipChange - La fonction pour afficher ou masquer l'infobulle.
 * @param {string} [props.placeholder] - Le texte indicatif pour le champ de saisie.
 * @param {boolean} [props.disabled=false] - Un booléen pour désactiver le champ.
 * @returns {React.ReactElement} Le champ de formulaire avec sa logique d'héritage.
 */
const AdminField = memo<{
  id: string;
  name: string;
  label: string;
  tooltip: string;
  value: string;
  inheritedValue: string;
  useInherited: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInheritedChange: (useInherited: boolean) => void;
  onTooltipChange: (tooltip: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}>(({
  id,
  name,
  label,
  tooltip,
  value,
  inheritedValue,
  useInherited,
  onChange,
  onInheritedChange,
  onTooltipChange,
  placeholder,
  disabled = false
}) => {
  const { t } = useTranslation();
  
  /**
   * @callback handleInheritedChange
   * @description Gère le changement d'état de la checkbox d'héritage.
   * Appelle la fonction onInheritedChange passée en props avec la nouvelle valeur.
   * @param {React.ChangeEvent<HTMLInputElement>} e - L'événement de changement.
   */
  const handleInheritedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onInheritedChange(e.target.checked);
  }, [onInheritedChange]);

  const checkboxId = `inherit_${id}`;

  return (
    <div>
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id={checkboxId}
          checked={useInherited}
          onChange={handleInheritedChange}
          disabled={disabled}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
        />
        <label htmlFor={checkboxId} className="ml-3 text-sm text-gray-700">
          {t('tactiqueFormAdmin.adminField.useSameAsCampaign')}
        </label>
      </div>
      
      <div className="flex items-center gap-3 mb-2">
        {createLabelWithHelp(label, tooltip, onTooltipChange)}
      </div>
      
      {useInherited ? (
        <input
          type="text"
          value={inheritedValue || ''}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500"
          placeholder={t('tactiqueFormAdmin.adminField.inheritedValuePlaceholder')}
        />
      ) : (
        <input
          type="text"
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          placeholder={placeholder}
        />
      )}
    </div>
  );
});

AdminField.displayName = 'AdminField';

/**
 * @component TactiqueFormAdmin
 * @description Le composant principal qui assemble la section administrative du formulaire de tactique.
 * Il utilise le composant AdminField pour les champs "Numéro de facturation" et "PO".
 * Affiche également des informations contextuelles sur l'héritage et les valeurs actuelles de la campagne.
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.formData - Les données du formulaire pour la tactique (valeurs spécifiques).
 * @param {boolean} props.useInheritedBilling - État d'héritage pour le numéro de facturation.
 * @param {boolean} props.useInheritedPO - État d'héritage pour le PO.
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onChange - Gestionnaire de changement pour les champs du formulaire.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - Gestionnaire pour l'affichage des infobulles.
 * @param {(useInherited: boolean) => void} props.onInheritedBillingChange - Gestionnaire pour le changement d'héritage du numéro de facturation.
 * @param {(useInherited: boolean) => void} props.onInheritedPOChange - Gestionnaire pour le changement d'héritage du PO.
 * @param {CampaignAdminValues} props.campaignAdminValues - Les valeurs administratives actuelles de la campagne parente.
 * @param {boolean} [props.loading=false] - Indique si les données sont en cours de chargement, ce qui désactive les champs.
 * @returns {React.ReactElement} La section de formulaire pour l'administration.
 */
const TactiqueFormAdmin = memo<TactiqueFormAdminProps>(({
  formData,
  useInheritedBilling,
  useInheritedPO,
  onChange,
  onTooltipChange,
  onInheritedBillingChange,
  onInheritedPOChange,
  campaignAdminValues,
  loading = false
}) => {
  const { t } = useTranslation();
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {t('tactiqueFormAdmin.main.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('tactiqueFormAdmin.main.subtitle')}
        </p>
      </div>
      
      <div className="space-y-8">
        
        <AdminField
          id="TC_Billing_ID"
          name="TC_Billing_ID"
          label={t('tactiqueFormAdmin.billingNumber.label')}
          tooltip={t('tactiqueFormAdmin.billingNumber.tooltip')}
          value={formData.TC_Billing_ID || ''}
          inheritedValue={campaignAdminValues.CA_Billing_ID || ''}
          useInherited={useInheritedBilling}
          onChange={onChange}
          onInheritedChange={onInheritedBillingChange}
          onTooltipChange={onTooltipChange}
          placeholder={t('tactiqueFormAdmin.billingNumber.placeholder')}
          disabled={isDisabled}
        />

        <AdminField
          id="TC_PO"
          name="TC_PO"
          label={t('tactiqueFormAdmin.po.label')}
          tooltip={t('tactiqueFormAdmin.po.tooltip')}
          value={formData.TC_PO || ''}
          inheritedValue={campaignAdminValues.CA_PO || ''}
          useInherited={useInheritedPO}
          onChange={onChange}
          onInheritedChange={onInheritedPOChange}
          onTooltipChange={onTooltipChange}
          placeholder={t('tactiqueFormAdmin.po.placeholder')}
          disabled={isDisabled}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">
          {t('tactiqueFormAdmin.inheritanceInfo.title')}
        </h5>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            • <strong>{t('tactiqueFormAdmin.inheritanceInfo.enabledTitle')}</strong>{t('tactiqueFormAdmin.inheritanceInfo.enabledDesc')}
          </p>
          <p>
            • <strong>{t('tactiqueFormAdmin.inheritanceInfo.disabledTitle')}</strong>{t('tactiqueFormAdmin.inheritanceInfo.disabledDesc')}
          </p>
          <p>
            • {t('tactiqueFormAdmin.inheritanceInfo.updateNote')}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-800 mb-3">
          {t('tactiqueFormAdmin.campaignValues.title')}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">{t('tactiqueFormAdmin.campaignValues.billingNumberLabel')}</span>
            <div className="mt-1 text-gray-800">
              {campaignAdminValues.CA_Billing_ID || (
                <span className="italic text-gray-500">{t('tactiqueFormAdmin.campaignValues.notSet')}</span>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-600">{t('tactiqueFormAdmin.po.label')}:</span>
            <div className="mt-1 text-gray-800">
              {campaignAdminValues.CA_PO || (
                <span className="italic text-gray-500">{t('tactiqueFormAdmin.campaignValues.notSet')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{t('tactiqueFormAdmin.loading.message')}</p>
        </div>
      )}

      {(!campaignAdminValues.CA_Billing_ID && !campaignAdminValues.CA_PO) && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ⚠️ {t('tactiqueFormAdmin.warning.noCampaignValues')}
          </p>
        </div>
      )}
    </div>
  );
});

TactiqueFormAdmin.displayName = 'TactiqueFormAdmin';

export default TactiqueFormAdmin;