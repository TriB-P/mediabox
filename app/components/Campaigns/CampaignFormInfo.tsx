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

// ==================== TYPES ====================

interface CampaignFormInfoProps {
  formData: CampaignFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Listes dynamiques
  divisions: ShortcodeItem[];
  quarters: ShortcodeItem[];
  years: ShortcodeItem[];
  customDim1List: ShortcodeItem[];
  customDim2List: ShortcodeItem[];
  customDim3List: ShortcodeItem[];
  
  // Configuration client
  clientConfig: {
    CA_Custom_Dim_1?: string;
    CA_Custom_Dim_2?: string;
    CA_Custom_Dim_3?: string;
  };
  
  // États de chargement
  loadingDivisions: boolean;
  loadingQuarters: boolean;
  loadingYears: boolean;
  loadingCustomDims: boolean;
  loading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

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
          {/* Note: campaignId supprimé car non présent dans CampaignFormData */}

          {/* Nom de la campagne */}
          <FormInput
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            type="text"
            placeholder="Ex: Lancement produit été 2024"
            required={!isDisabled}
            label={createLabelWithHelp(
              'Nom de la campagne *', 
              'Nom descriptif de votre campagne marketing', 
              onTooltipChange
            )}
          />

          {/* Division */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Division', 
                'Division ou unité d\'affaires responsable de cette campagne', 
                onTooltipChange
              )}
            </div>
            {loadingDivisions ? (
              <div className="text-sm text-gray-500 py-2">
                Chargement des divisions...
              </div>
            ) : divisions.length > 0 ? (
              <SmartSelect
                id="division"
                name="division"
                value={formData.division || ''}
                onChange={onChange}
                options={divisions.map(division => ({
                  id: division.id,
                  label: division.SH_Display_Name_FR || division.SH_Code
                }))}
                placeholder="Sélectionner une division"
                label=""
              />
            ) : (
              <FormInput
                id="division"
                name="division"
                value={formData.division || ''}
                onChange={onChange}
                type="text"
                placeholder="Aucune division disponible - saisie libre"
                label=""
              />
            )}
          </div>

          {/* Quarter */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Trimestre *', 
                'Période fiscale ou temporelle de la campagne', 
                onTooltipChange
              )}
            </div>
            {loadingQuarters ? (
              <div className="text-sm text-gray-500 py-2">
                Chargement des trimestres...
              </div>
            ) : quarters.length > 0 ? (
              <SmartSelect
                id="quarter"
                name="quarter"
                value={formData.quarter}
                onChange={onChange}
                options={quarters.map(quarter => ({
                  id: quarter.id,
                  label: quarter.SH_Display_Name_FR || quarter.SH_Code
                }))}
                placeholder="Sélectionner un trimestre"
                label=""
              />
            ) : (
              <select
                name="quarter"
                id="quarter"
                value={formData.quarter}
                onChange={onChange}
                required={!isDisabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sélectionner un trimestre</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
                <option value="Full Year">Année complète</option>
              </select>
            )}
          </div>

          {/* Année */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {createLabelWithHelp(
                'Année *', 
                'Année fiscale ou calendaire de la campagne', 
                onTooltipChange
              )}
            </div>
            {loadingYears ? (
              <div className="text-sm text-gray-500 py-2">
                Chargement des années...
              </div>
            ) : years.length > 0 ? (
              <SmartSelect
                id="year"
                name="year"
                value={formData.year}
                onChange={onChange}
                options={years.map(year => ({
                  id: year.id,
                  label: year.SH_Display_Name_FR || year.SH_Code
                }))}
                placeholder="Sélectionner une année"
                label=""
              />
            ) : (
              <FormInput
                id="year"
                name="year"
                value={formData.year}
                onChange={onChange}
                type="number"
                placeholder="2024"
                required={!isDisabled}
                label=""
              />
            )}
          </div>

          {/* Dimensions personnalisées */}
          {clientConfig.CA_Custom_Dim_1 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(
                  clientConfig.CA_Custom_Dim_1.replace('CA_', ''), 
                  `Dimension personnalisée: ${clientConfig.CA_Custom_Dim_1}`, 
                  onTooltipChange
                )}
              </div>
              {loadingCustomDims ? (
                <div className="text-sm text-gray-500 py-2">
                  Chargement...
                </div>
              ) : customDim1List.length > 0 ? (
                <SmartSelect
                  id="customDim1"
                  name="customDim1"
                  value={formData.customDim1 || ''}
                  onChange={onChange}
                  options={customDim1List.map(item => ({
                    id: item.id,
                    label: item.SH_Display_Name_FR || item.SH_Code
                  }))}
                  placeholder="Sélectionner une option"
                  label=""
                />
              ) : (
                <FormInput
                  id="customDim1"
                  name="customDim1"
                  value={formData.customDim1 || ''}
                  onChange={onChange}
                  type="text"
                  placeholder="Saisie libre"
                  label=""
                />
              )}
            </div>
          )}

          {clientConfig.CA_Custom_Dim_2 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(
                  clientConfig.CA_Custom_Dim_2.replace('CA_', ''), 
                  `Dimension personnalisée: ${clientConfig.CA_Custom_Dim_2}`, 
                  onTooltipChange
                )}
              </div>
              {loadingCustomDims ? (
                <div className="text-sm text-gray-500 py-2">
                  Chargement...
                </div>
              ) : customDim2List.length > 0 ? (
                <SmartSelect
                  id="customDim2"
                  name="customDim2"
                  value={formData.customDim2 || ''}
                  onChange={onChange}
                  options={customDim2List.map(item => ({
                    id: item.id,
                    label: item.SH_Display_Name_FR || item.SH_Code
                  }))}
                  placeholder="Sélectionner une option"
                  label=""
                />
              ) : (
                <FormInput
                  id="customDim2"
                  name="customDim2"
                  value={formData.customDim2 || ''}
                  onChange={onChange}
                  type="text"
                  placeholder="Saisie libre"
                  label=""
                />
              )}
            </div>
          )}

          {clientConfig.CA_Custom_Dim_3 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                {createLabelWithHelp(
                  clientConfig.CA_Custom_Dim_3.replace('CA_', ''), 
                  `Dimension personnalisée: ${clientConfig.CA_Custom_Dim_3}`, 
                  onTooltipChange
                )}
              </div>
              {loadingCustomDims ? (
                <div className="text-sm text-gray-500 py-2">
                  Chargement...
                </div>
              ) : customDim3List.length > 0 ? (
                <SmartSelect
                  id="customDim3"
                  name="customDim3"
                  value={formData.customDim3 || ''}
                  onChange={onChange}
                  options={customDim3List.map(item => ({
                    id: item.id,
                    label: item.SH_Display_Name_FR || item.SH_Code
                  }))}
                  placeholder="Sélectionner une option"
                  label=""
                />
              ) : (
                <FormInput
                  id="customDim3"
                  name="customDim3"
                  value={formData.customDim3 || ''}
                  onChange={onChange}
                  type="text"
                  placeholder="Saisie libre"
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