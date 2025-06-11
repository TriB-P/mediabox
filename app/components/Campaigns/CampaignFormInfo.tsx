// app/components/Campaigns/CampaignFormInfo.tsx

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
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-6">
      <FormSection
        title="Informations générales"
        description="Configuration de base de la campagne"
      >
        <div className="space-y-6">
          {/* 🔥 NOUVEAU : Champ pour CA_Name */}
          <FormInput
            id="CA_Name"
            name="CA_Name"
            value={formData.CA_Name}
            onChange={onChange}
            type="text"
            placeholder="Ex: Lancement estival"
            required={!isDisabled}
            label={createLabelWithHelp(
              'Nom de la campagne *', 
              'Nom d\'affichage principal de la campagne.', 
              onTooltipChange
            )}
          />
          
          {/* 🔥 MODIFIÉ : Champ pour CA_Campaign_Identifier */}
          <FormInput
            id="CA_Campaign_Identifier"
            name="CA_Campaign_Identifier"
            value={formData.CA_Campaign_Identifier}
            onChange={onChange}
            type="text"
            placeholder="Ex: BISTRO-2024-PROMOTION"
            required={!isDisabled}
            label={createLabelWithHelp(
              'Identifiant de campagne *', 
              'Identifiant unique utilisé dans les taxonomies.', 
              onTooltipChange
            )}
          />

          {/* 🔥 CORRECTION : Ancien champ CA_Creative_Folder qui était manquant */}
          <FormInput
            id="CA_Creative_Folder"
            name="CA_Creative_Folder"
            value={formData.CA_Creative_Folder || ''}
            onChange={onChange}
            type="text"
            placeholder="Lien vers le dossier des créatifs"
            label={createLabelWithHelp(
              'Dossier créatifs',
              'Lien vers le dossier contenant les créatifs pour cette campagne',
              onTooltipChange
            )}
          />

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp('Division', 'Division ou unité d\'affaires', onTooltipChange)}
            </div>
            {loadingDivisions ? <div className="text-sm text-gray-500 py-2">Chargement...</div> : (
              <SmartSelect
                id="CA_Division"
                name="CA_Division"
                value={formData.CA_Division || ''}
                onChange={onChange}
                options={divisions.map(d => ({ id: d.id, label: d.SH_Display_Name_FR }))}
                placeholder="Sélectionner une division"
                label=""
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp('Trimestre *', 'Période fiscale de la campagne', onTooltipChange)}
            </div>
            {loadingQuarters ? <div className="text-sm text-gray-500 py-2">Chargement...</div> : (
              <SmartSelect
                id="CA_Quarter"
                name="CA_Quarter"
                value={formData.CA_Quarter}
                onChange={onChange}
                options={quarters.map(q => ({ id: q.id, label: q.SH_Display_Name_FR }))}
                placeholder="Sélectionner un trimestre"
                label=""
              />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp('Année *', 'Année fiscale de la campagne', onTooltipChange)}
            </div>
            {loadingYears ? <div className="text-sm text-gray-500 py-2">Chargement...</div> : (
              <SmartSelect
                id="CA_Year"
                name="CA_Year"
                value={formData.CA_Year}
                onChange={onChange}
                options={years.map(y => ({ id: y.id, label: y.SH_Display_Name_FR }))}
                placeholder="Sélectionner une année"
                label=""
              />
            )}
          </div>

          {clientConfig.CA_Custom_Dim_1 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(clientConfig.CA_Custom_Dim_1, `Dimension: ${clientConfig.CA_Custom_Dim_1}`, onTooltipChange)}
              </div>
              {loadingCustomDims ? <div className="text-sm text-gray-500 py-2">Chargement...</div> : (
                <SmartSelect
                  id="CA_Custom_Dim_1"
                  name="CA_Custom_Dim_1"
                  value={formData.CA_Custom_Dim_1 || ''}
                  onChange={onChange}
                  options={customDim1List.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                  placeholder={`Sélectionner ${clientConfig.CA_Custom_Dim_1}`}
                  label=""
                />
              )}
            </div>
          )}

          {clientConfig.CA_Custom_Dim_2 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(clientConfig.CA_Custom_Dim_2, `Dimension: ${clientConfig.CA_Custom_Dim_2}`, onTooltipChange)}
              </div>
              {loadingCustomDims ? <div className="text-sm text-gray-500 py-2">Chargement...</div> : (
                <SmartSelect
                  id="CA_Custom_Dim_2"
                  name="CA_Custom_Dim_2"
                  value={formData.CA_Custom_Dim_2 || ''}
                  onChange={onChange}
                  options={customDim2List.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                  placeholder={`Sélectionner ${clientConfig.CA_Custom_Dim_2}`}
                  label=""
                />
              )}
            </div>
          )}

          {clientConfig.CA_Custom_Dim_3 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(clientConfig.CA_Custom_Dim_3, `Dimension: ${clientConfig.CA_Custom_Dim_3}`, onTooltipChange)}
              </div>
              {loadingCustomDims ? <div className="text-sm text-gray-500 py-2">Chargement...</div> : (
                <SmartSelect
                  id="CA_Custom_Dim_3"
                  name="CA_Custom_Dim_3"
                  value={formData.CA_Custom_Dim_3 || ''}
                  onChange={onChange}
                  options={customDim3List.map(item => ({ id: item.id, label: item.SH_Display_Name_FR }))}
                  placeholder={`Sélectionner ${clientConfig.CA_Custom_Dim_3}`}
                  label=""
                />
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