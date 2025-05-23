'use client';

import React, { memo } from 'react';
import { 
  FormInput, 
  FormTextarea,
  SmartSelect, 
  FormSection,
  createLabelWithHelp 
} from './TactiqueFormComponents';

// ==================== TYPES ====================

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
}

interface ClientCustomDimensions {
  Custom_Dim_CA_1?: string;
  Custom_Dim_CA_2?: string;
  Custom_Dim_CA_3?: string;
}

interface VisibleFields {
  TC_LoB?: boolean;
  TC_Media_Type?: boolean;
  TC_Publisher?: boolean;
  TC_Buying_Method?: boolean;
  TC_Custom_Dim_1?: boolean;
  TC_Custom_Dim_2?: boolean;
  TC_Custom_Dim_3?: boolean;
  TC_Inventory?: boolean;
  TC_Market?: boolean;
  TC_Language?: boolean;
}

interface TactiqueFormStrategieProps {
  // Données du formulaire
  formData: {
    TC_LoB?: string;
    TC_Media_Type?: string;
    TC_Publisher?: string;
    TC_Inventory?: string;
    TC_Product_Open?: string;
    TC_Targeting_Open?: string;
    TC_Market_Open?: string;
    TC_Frequence?: string;
    TC_Location?: string;
    TC_Market?: string;
    TC_Language?: string;
    TC_Format_Open?: string;
    TC_Buying_Method?: string;
    TC_Custom_Dim_1?: string;
    TC_Custom_Dim_2?: string;
    TC_Custom_Dim_3?: string;
    TC_NumberCreatives?: string;
    TC_AssetDate?: string;
  };
  
  // Gestionnaires d'événements
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  
  // Données externes
  dynamicLists: { [key: string]: ListItem[] };
  visibleFields: VisibleFields;
  customDimensions: ClientCustomDimensions;
  publishersOptions: { id: string; label: string }[];
  
  // État de chargement
  loading?: boolean;
  isPublishersLoading?: boolean;
}

// ==================== COMPOSANT PRINCIPAL ====================

const TactiqueFormStrategie = memo<TactiqueFormStrategieProps>(({
  formData,
  onChange,
  onTooltipChange,
  dynamicLists,
  visibleFields,
  customDimensions,
  publishersOptions,
  loading = false,
  isPublishersLoading = false
}) => {
  // Désactiver les champs si en cours de chargement
  const isDisabled = loading;

  return (
    <div className="p-8 space-y-8">
      {/* En-tête de section */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Stratégie média
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration stratégique et ciblage
        </p>
      </div>
      
      {/* Section principale */}
      <div className="space-y-6">
        
        {/* TC_LoB */}
        {(dynamicLists.TC_LoB && dynamicLists.TC_LoB.length > 0) && (
          <SmartSelect
            id="TC_LoB"
            name="TC_LoB"
            value={formData.TC_LoB || ''}
            onChange={onChange}
            options={dynamicLists.TC_LoB?.map(item => ({ 
              id: item.id, 
              label: item.SH_Display_Name_FR 
            })) || []}
            placeholder="Sélectionner une ligne d'affaire..."
            label={createLabelWithHelp(
              'Ligne d\'affaire', 
              'Masquer si aucune liste trouvée', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Media_Type */}
        {(dynamicLists.TC_Media_Type && dynamicLists.TC_Media_Type.length > 0) && (
          <SmartSelect
            id="TC_Media_Type"
            name="TC_Media_Type"
            value={formData.TC_Media_Type || ''}
            onChange={onChange}
            options={dynamicLists.TC_Media_Type?.map(item => ({ 
              id: item.id, 
              label: item.SH_Display_Name_FR 
            })) || []}
            placeholder="Sélectionner un type de média..."
            label={createLabelWithHelp(
              'Type média', 
              'Masquer si aucune liste trouvée', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Publisher */}
        {(!isPublishersLoading && publishersOptions.length > 0) && (
          <SmartSelect
            id="TC_Publisher"
            name="TC_Publisher"
            value={formData.TC_Publisher || ''}
            onChange={onChange}
            options={publishersOptions}
            placeholder="Sélectionner un partenaire..."
            label={createLabelWithHelp(
              'Partenaire', 
              'Liste des partenaires pré-chargée', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Inventory */}
        {(!isPublishersLoading && publishersOptions.length > 0) && (
          <SmartSelect
            id="TC_Inventory"
            name="TC_Inventory"
            value={formData.TC_Inventory || ''}
            onChange={onChange}
            options={publishersOptions}
            placeholder="Sélectionner un inventaire..."
            label={createLabelWithHelp(
              'Inventaire', 
              'Masquer si aucune liste trouvée', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Product_Open */}
        <FormInput
          id="TC_Product_Open"
          name="TC_Product_Open"
          value={formData.TC_Product_Open || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: iPhone 15 Pro"
          label={createLabelWithHelp(
            'Description du produit', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

        {/* TC_Targeting_Open */}
        <FormTextarea
          id="TC_Targeting_Open"
          name="TC_Targeting_Open"
          value={formData.TC_Targeting_Open || ''}
          onChange={onChange}
          rows={3}
          placeholder="Décrivez le ciblage de cette tactique..."
          label={createLabelWithHelp(
            'Description de l\'audience', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

        {/* TC_Market_Open */}
        <FormInput
          id="TC_Market_Open"
          name="TC_Market_Open"
          value={formData.TC_Market_Open || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: Canada, Québec, Montréal"
          label={createLabelWithHelp(
            'Description du marché', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

        {/* TC_Frequence */}
        <FormInput
          id="TC_Frequence"
          name="TC_Frequence"
          value={formData.TC_Frequence || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: 3 fois par semaine"
          label={createLabelWithHelp(
            'Fréquence', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

        {/* TC_Location */}
        <FormInput
          id="TC_Location"
          name="TC_Location"
          value={formData.TC_Location || ''}
          onChange={onChange}
          type="text"
          placeholder="Décrivez l'emplacement"
          label={createLabelWithHelp(
            'Description de l\'emplacement', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

        {/* TC_Market */}
        {(dynamicLists.TC_Market && dynamicLists.TC_Market.length > 0) && (
          <SmartSelect
            id="TC_Market"
            name="TC_Market"
            value={formData.TC_Market || ''}
            onChange={onChange}
            options={dynamicLists.TC_Market?.map(item => ({ 
              id: item.id, 
              label: item.SH_Display_Name_FR 
            })) || []}
            placeholder="Sélectionner un marché..."
            label={createLabelWithHelp(
              'Marché', 
              'Masquer si aucune liste trouvée', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Language */}
        {(dynamicLists.TC_Language && dynamicLists.TC_Language.length > 0) && (
          <SmartSelect
            id="TC_Language"
            name="TC_Language"
            value={formData.TC_Language || ''}
            onChange={onChange}
            options={dynamicLists.TC_Language?.map(item => ({ 
              id: item.id, 
              label: item.SH_Display_Name_FR 
            })) || []}
            placeholder="Sélectionner une langue..."
            label={createLabelWithHelp(
              'Langue', 
              'Masquer si aucune liste trouvée', 
              onTooltipChange
            )}
          />
        )}

        {/* TC_Format_Open */}
        <FormTextarea
          id="TC_Format_Open"
          name="TC_Format_Open"
          value={formData.TC_Format_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder="Décrivez le format utilisé..."
          label={createLabelWithHelp(
            'Description du format', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />
      </div>

      {/* Sous-section: Champs personnalisés */}
      {(visibleFields.TC_Custom_Dim_1 || visibleFields.TC_Custom_Dim_2 || 
        visibleFields.TC_Custom_Dim_3 || visibleFields.TC_Buying_Method) && (
        <FormSection 
          title="Champs personnalisés"
          description="Configuration spécifique au client"
        >
          {/* TC_Buying_Method */}
          {(dynamicLists.TC_Buying_Method && dynamicLists.TC_Buying_Method.length > 0) && (
            <SmartSelect
              id="TC_Buying_Method"
              name="TC_Buying_Method"
              value={formData.TC_Buying_Method || ''}
              onChange={onChange}
              options={dynamicLists.TC_Buying_Method?.map(item => ({ 
                id: item.id, 
                label: item.SH_Display_Name_FR 
              })) || []}
              placeholder="Sélectionner une méthode d'achat..."
              label={createLabelWithHelp(
                'Méthode d\'achat', 
                'Masquer si aucune liste trouvée', 
                onTooltipChange
              )}
            />
          )}

          {/* TC_Custom_Dim_1 */}
          {(dynamicLists.TC_Custom_Dim_1 && dynamicLists.TC_Custom_Dim_1.length > 0) && (
            <SmartSelect
              id="TC_Custom_Dim_1"
              name="TC_Custom_Dim_1"
              value={formData.TC_Custom_Dim_1 || ''}
              onChange={onChange}
              options={dynamicLists.TC_Custom_Dim_1?.map(item => ({ 
                id: item.id, 
                label: item.SH_Display_Name_FR 
              })) || []}
              placeholder={`Sélectionner ${customDimensions.Custom_Dim_CA_1}...`}
              label={createLabelWithHelp(
                customDimensions.Custom_Dim_CA_1 || 'Dimension personnalisée 1', 
                'Afficher seulement si Custom_Dim_CA_1 (dans la collection du client) est rempli. Champs ouvert si aucune liste est trouvée.', 
                onTooltipChange
              )}
            />
          )}

          {/* TC_Custom_Dim_2 */}
          {(dynamicLists.TC_Custom_Dim_2 && dynamicLists.TC_Custom_Dim_2.length > 0) && (
            <SmartSelect
              id="TC_Custom_Dim_2"
              name="TC_Custom_Dim_2"
              value={formData.TC_Custom_Dim_2 || ''}
              onChange={onChange}
              options={dynamicLists.TC_Custom_Dim_2?.map(item => ({ 
                id: item.id, 
                label: item.SH_Display_Name_FR 
              })) || []}
              placeholder={`Sélectionner ${customDimensions.Custom_Dim_CA_2}...`}
              label={createLabelWithHelp(
                customDimensions.Custom_Dim_CA_2 || 'Dimension personnalisée 2', 
                'Afficher seulement si Custom_Dim_CA_2 (dans la collection du client) est rempli. Champs ouvert si aucune liste est trouvée.', 
                onTooltipChange
              )}
            />
          )}

          {/* TC_Custom_Dim_3 */}
          {(dynamicLists.TC_Custom_Dim_3 && dynamicLists.TC_Custom_Dim_3.length > 0) && (
            <SmartSelect
              id="TC_Custom_Dim_3"
              name="TC_Custom_Dim_3"
              value={formData.TC_Custom_Dim_3 || ''}
              onChange={onChange}
              options={dynamicLists.TC_Custom_Dim_3?.map(item => ({ 
                id: item.id, 
                label: item.SH_Display_Name_FR 
              })) || []}
              placeholder={`Sélectionner ${customDimensions.Custom_Dim_CA_3}...`}
              label={createLabelWithHelp(
                customDimensions.Custom_Dim_CA_3 || 'Dimension personnalisée 3', 
                'Afficher seulement si Custom_Dim_CA_3 (dans la collection du client) est rempli. Champs ouvert si aucune liste est trouvée.', 
                onTooltipChange
              )}
            />
          )}
        </FormSection>
      )}

      {/* Sous-section: Production */}
      <FormSection 
        title="Production"
        description="Gestion des créatifs et des livrables"
      >
        {/* TC_NumberCreatives */}
        <FormInput
          id="TC_NumberCreatives"
          name="TC_NumberCreatives"
          value={formData.TC_NumberCreatives || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: 5 bannières + 2 vidéos"
          label={createLabelWithHelp(
            'Nombre de créatifs suggérés', 
            'Open string. Pas de contraintes', 
            onTooltipChange
          )}
        />

        {/* TC_AssetDate */}
        <FormInput
          id="TC_AssetDate"
          name="TC_AssetDate"
          value={formData.TC_AssetDate || ''}
          onChange={onChange}
          type="date"
          label={createLabelWithHelp(
            'Date de livraison des créatifs', 
            'Open date. Pas de contraintes', 
            onTooltipChange
          )}
        />
      </FormSection>
    </div>
  );
});

TactiqueFormStrategie.displayName = 'TactiqueFormStrategie';

export default TactiqueFormStrategie;