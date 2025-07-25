/**
 * @file Ce fichier contient le composant React CampaignFormInfo.
 * @description Ce composant est responsable de l'affichage de la section "Informations générales" du formulaire de création ou d'édition d'une campagne.
 * Il s'agit d'un composant de présentation (ou "dumb component") qui reçoit toutes les données nécessaires et les fonctions de rappel (callbacks) via ses props.
 * Il ne gère aucune logique métier ni d'appels directs à la base de données.
 */

'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  SmartSelect, 
  createLabelWithHelp,
  FormSection 
} from '../Tactiques/Tactiques/TactiqueFormComponents';
import { CampaignFormData } from '../../types/campaign';
import { ShortcodeItem } from '../../lib/listService';
import { useTranslation } from '../../contexts/LanguageContext';


interface CampaignFormInfoProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  divisions: ShortcodeItem[];
  quarters: ShortcodeItem[];
  years: ShortcodeItem[];
  customDim1List: ShortcodeItem[];
  customDim2List: ShortcodeItem[];
  customDim3List: ShortcodeItem[];
  clientConfig: {
    CA_Custom_Dim_1?: string;
    CA_Custom_Dim_2?: string;
    CA_Custom_Dim_3?: string;
  };
  loadingDivisions: boolean;
  loadingQuarters: boolean;
  loadingYears: boolean;
  loadingCustomDims: boolean;
  loading?: boolean;
}

/**
 * Affiche la section du formulaire dédiée aux informations générales d'une campagne.
 * Ce composant est optimisé avec React.memo pour éviter les rendus inutiles si ses props ne changent pas.
 *
 * @param {CampaignFormInfoProps} props - Les propriétés du composant.
 * @param {CampaignFormData} props.formData - Les données actuelles du formulaire pour la campagne.
 * @param {(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void} props.onChange - Fonction de rappel appelée lors d'un changement dans un champ du formulaire.
 * @param {(tooltip: string | null) => void} props.onTooltipChange - Fonction de rappel pour afficher une infobulle d'aide.
 * @param {ShortcodeItem[]} props.divisions - Liste des divisions disponibles pour le sélecteur.
 * @param {ShortcodeItem[]} props.quarters - Liste des trimestres disponibles pour le sélecteur.
 * @param {ShortcodeItem[]} props.years - Liste des années disponibles pour le sélecteur.
 * @param {ShortcodeItem[]} props.customDim1List - Liste pour la dimension personnalisée 1.
 * @param {ShortcodeItem[]} props.customDim2List - Liste pour la dimension personnalisée 2.
 * @param {ShortcodeItem[]} props.customDim3List - Liste pour la dimension personnalisée 3.
 * @param {object} props.clientConfig - Configuration client pour les noms des dimensions personnalisées.
 * @param {boolean} props.loadingDivisions - Indicateur de chargement pour les divisions.
 * @param {boolean} props.loadingQuarters - Indicateur de chargement pour les trimestres.
 * @param {boolean} props.loadingYears - Indicateur de chargement pour les années.
 * @param {boolean} props.loadingCustomDims - Indicateur de chargement pour les dimensions personnalisées.
 * @param {boolean} [props.loading=false] - Indicateur de chargement global, désactive les champs du formulaire.
 * @returns {React.ReactElement} Le JSX du formulaire des informations de la campagne.
 */
const CampaignFormInfo = memo<CampaignFormInfoProps>(({
  formData,
  onChange,
  onTooltipChange,
  divisions,
  quarters,
  years,
  customDim1List,
  customDim2List,
  customDim3List,
  clientConfig,
  loadingDivisions,
  loadingQuarters,
  loadingYears,
  loadingCustomDims,
  loading = false
}) => {
  const { t } = useTranslation();
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title={t('campaigns.formInfo.title')}
        description={t('campaigns.formInfo.description')}
      >
        <div className="space-y-6">
          <FormInput
            id="CA_Name"
            name="CA_Name"
            value={formData.CA_Name}
            onChange={onChange}
            type="text"
            placeholder={t('campaigns.formInfo.namePlaceholder')}
            required={!isDisabled}
            label={createLabelWithHelp(
              t('campaigns.formInfo.nameLabel'), 
              t('campaigns.formInfo.nameHelp'), 
              onTooltipChange
            )}
          />
          
          <FormInput
            id="CA_Campaign_Identifier"
            name="CA_Campaign_Identifier"
            value={formData.CA_Campaign_Identifier}
            onChange={onChange}
            type="text"
            placeholder={t('campaigns.formInfo.identifierPlaceholder')}
            required={!isDisabled}
            label={createLabelWithHelp(
              t('campaigns.formInfo.identifierLabel'), 
              t('campaigns.formInfo.identifierHelp'), 
              onTooltipChange
            )}
          />

          <FormInput
            id="CA_Creative_Folder"
            name="CA_Creative_Folder"
            value={formData.CA_Creative_Folder || ''}
            onChange={onChange}
            type="text"
            placeholder={t('campaigns.formInfo.creativeFolderPlaceholder')}
            label={createLabelWithHelp(
              t('campaigns.formInfo.creativeFolderLabel'),
              t('campaigns.formInfo.creativeFolderHelp'),
              onTooltipChange
            )}
          />

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(t('campaigns.formInfo.divisionLabel'), t('campaigns.formInfo.divisionHelp'), onTooltipChange)}
            </div>
            {loadingDivisions ? <div className="text-sm text-gray-500 py-2">{t('common.loading')}</div> : (
              <SmartSelect
                id="CA_Division"
                name="CA_Division"
                value={formData.CA_Division || ''}
                onChange={onChange}
                options={divisions.map(d => ({ id: d.id, label: d.SH_Display_Name_FR }))}
                placeholder={t('campaigns.formInfo.divisionPlaceholder')}
                label=""
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(t('campaigns.formInfo.quarterLabel'), t('campaigns.formInfo.quarterHelp'), onTooltipChange)}
            </div>
            {loadingQuarters ? <div className="text-sm text-gray-500 py-2">{t('common.loading')}</div> : (
              <SmartSelect
                id="CA_Quarter"
                name="CA_Quarter"
                value={formData.CA_Quarter|| ''}
                onChange={onChange}
                options={quarters.map(q => ({ id: q.id, label: q.SH_Display_Name_FR }))}
                placeholder={t('campaigns.formInfo.quarterPlaceholder')}
                label=""
              />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(t('campaigns.formInfo.yearLabel'), t('campaigns.formInfo.yearHelp'), onTooltipChange)}
            </div>
            {loadingYears ? <div className="text-sm text-gray-500 py-2">{t('common.loading')}</div> : (
              <SmartSelect
                id="CA_Year"
                name="CA_Year"
                value={formData.CA_Year}
                onChange={onChange}
                options={years.map(y => ({ id: y.id, label: y.SH_Display_Name_FR }))}
                placeholder={t('campaigns.formInfo.yearPlaceholder')}
                label=""
              />
            )}
          </div>

          {clientConfig.CA_Custom_Dim_1 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(clientConfig.CA_Custom_Dim_1, t('campaigns.formInfo.customDimHelp', { name: clientConfig.CA_Custom_Dim_1 }), onTooltipChange)}
              </div>
              {loadingCustomDims ? <div className="text-sm text-gray-500 py-2">{t('common.loading')}</div> : (
                customDim1List.length > 0 ? (
                  <SmartSelect
                    id="CA_Custom_Dim_1"
                    name="CA_Custom_Dim_1"
                    value={formData.CA_Custom_Dim_1 || ''}
                    onChange={onChange}
                    options={customDim1List.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                    placeholder={t('campaigns.formInfo.customDimSelectPlaceholder', { name: clientConfig.CA_Custom_Dim_1 })}
                    label=""
                  />
                ) : (
                  <FormInput
                    id="CA_Custom_Dim_1"
                    name="CA_Custom_Dim_1"
                    value={formData.CA_Custom_Dim_1 || ''}
                    onChange={onChange}
                    type="text"
                    placeholder={t('campaigns.formInfo.customDimInputPlaceholder', { name: clientConfig.CA_Custom_Dim_1 })}
                    label=""
                  />
                )
              )}
            </div>
          )}

          {clientConfig.CA_Custom_Dim_2 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(clientConfig.CA_Custom_Dim_2, t('campaigns.formInfo.customDimHelp', { name: clientConfig.CA_Custom_Dim_2 }), onTooltipChange)}
              </div>
              {loadingCustomDims ? <div className="text-sm text-gray-500 py-2">{t('common.loading')}</div> : (
                customDim2List.length > 0 ? (
                  <SmartSelect
                    id="CA_Custom_Dim_2"
                    name="CA_Custom_Dim_2"
                    value={formData.CA_Custom_Dim_2 || ''}
                    onChange={onChange}
                    options={customDim2List.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                    placeholder={t('campaigns.formInfo.customDimSelectPlaceholder', { name: clientConfig.CA_Custom_Dim_2 })}
                    label=""
                  />
                ) : (
                  <FormInput
                    id="CA_Custom_Dim_2"
                    name="CA_Custom_Dim_2"
                    value={formData.CA_Custom_Dim_2 || ''}
                    onChange={onChange}
                    type="text"
                    placeholder={t('campaigns.formInfo.customDimInputPlaceholder', { name: clientConfig.CA_Custom_Dim_2 })}
                    label=""
                  />
                )
              )}
            </div>
          )}

          {clientConfig.CA_Custom_Dim_3 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(clientConfig.CA_Custom_Dim_3, t('campaigns.formInfo.customDimHelp', { name: clientConfig.CA_Custom_Dim_3 }), onTooltipChange)}
              </div>
              {loadingCustomDims ? <div className="text-sm text-gray-500 py-2">{t('common.loading')}</div> : (
                customDim3List.length > 0 ? (
                  <SmartSelect
                    id="CA_Custom_Dim_3"
                    name="CA_Custom_Dim_3"
                    value={formData.CA_Custom_Dim_3 || ''}
                    onChange={onChange}
                    options={customDim3List.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                    placeholder={t('campaigns.formInfo.customDimSelectPlaceholder', { name: clientConfig.CA_Custom_Dim_3 })}
                    label=""
                  />
                ) : (
                  <FormInput
                    id="CA_Custom_Dim_3"
                    name="CA_Custom_Dim_3"
                    value={formData.CA_Custom_Dim_3 || ''}
                    onChange={onChange}
                    type="text"
                    placeholder={t('campaigns.formInfo.customDimInputPlaceholder', { name: clientConfig.CA_Custom_Dim_3 })}
                    label=""
                  />
                )
              )}
            </div>
          )}

        </div>
      </FormSection>
    </div>
  );
});

CampaignFormInfo.displayName = 'CampaignFormInfo';

export default CampaignFormInfo;