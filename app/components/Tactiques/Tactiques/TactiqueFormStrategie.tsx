// app/components/Tactiques/Tactiques/TactiqueFormStrategie.tsx

/**
 * CORRIGÉ : Ce fichier contient le composant React TactiqueFormStrategie avec la logique 
 * des dimensions personnalisées corrigée pour implémenter les 3 comportements souhaités :
 * 1. Dimension configurée + liste existe → SmartSelect avec label personnalisé
 * 2. Dimension configurée + pas de liste → FormInput avec label personnalisé  
 * 3. Dimension non configurée → Masqué
 * 
 * NOUVEAU : Ajout du filtrage dynamique des Publishers basé sur TC_Media_Type
 */
'use client';

import React, { memo, useMemo, useEffect } from 'react';
import {
  FormInput,
  FormTextarea,
  SmartSelect,
  FormSection,
  createLabelWithHelp
} from './TactiqueFormComponents';

interface ListItem {
  id: string;
  SH_Display_Name_FR: string;
  SH_Type?: string; // NOUVEAU : Propriété pour le filtrage des publishers
}

// MODIFIÉ : Interface corrigée pour correspondre à CustomDimensionsState du TactiqueDrawer
interface CustomDimensionsState {
  configured: {
    TC_Custom_Dim_1?: string;
    TC_Custom_Dim_2?: string;
    TC_Custom_Dim_3?: string;
  };
  hasLists: {
    TC_Custom_Dim_1: boolean;
    TC_Custom_Dim_2: boolean;
    TC_Custom_Dim_3: boolean;
  };
}

interface VisibleFields {
  TC_LOB?: boolean;
  TC_Media_Type?: boolean;
  TC_Publisher?: boolean;
  TC_Prog_Buying_Method?: boolean;
  TC_Custom_Dim_1?: boolean;
  TC_Custom_Dim_2?: boolean;
  TC_Custom_Dim_3?: boolean;
  TC_Inventory?: boolean;
  TC_Market?: boolean;
  TC_Language_Open?: boolean;
}

interface TactiqueFormStrategieProps {
  formData: {
    TC_LOB?: string;
    TC_Media_Type?: string;
    TC_Publisher?: string;
    TC_Inventory?: string;
    TC_Product_Open?: string;
    TC_Targeting_Open?: string;
    TC_Market_Open?: string;
    TC_Frequence?: string;
    TC_Location_Open?: string;
    TC_Market?: string;
    TC_Language_Open?: string;
    TC_Format_Open?: string;
    TC_Prog_Buying_Method?: string;
    TC_Custom_Dim_1?: string;
    TC_Custom_Dim_2?: string;
    TC_Custom_Dim_3?: string;
    TC_NumberCreative?: string;
    TC_AssetDate?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onTooltipChange: (tooltip: string | null) => void;
  dynamicLists: { [key: string]: ListItem[] };
  visibleFields: VisibleFields;
  customDimensions: CustomDimensionsState;
  publishersOptions: { id: string; label: string }[]; // DEPRECATED: Plus utilisé mais gardé pour compatibilité
  loading?: boolean;
  isPublishersLoading?: boolean; // DEPRECATED: Plus utilisé mais gardé pour compatibilité
}

/**
 * NOUVEAU : Mapping entre TC_Media_Type et SH_Type pour filtrer les publishers
 */
const getPublisherTypeFromMediaType = (mediaType: string): string | null => {
  const mapping: { [key: string]: string } = {
    'DIG': 'Digital Publisher',
    'SEA': 'Search Publisher',
    'TV': 'TV Station',
    'RAD': 'Radio Station',
    'PRI': 'Print Publisher',
    'OOH': 'OOH Publisher',
    'SH_DNEQYAVD': 'Social Publisher',
    'SH_R3Z3VC6B': 'Programmatic Publisher'
  };
  
  return mapping[mediaType] || null;
};

/**
 * NOUVEAU : Fonction utilitaire pour rendre une dimension personnalisée selon sa configuration
 * @param dimensionNumber - Le numéro de la dimension (1, 2 ou 3)
 * @param customDimensions - L'état des dimensions personnalisées
 * @param dynamicLists - Les listes dynamiques chargées
 * @param formData - Les données du formulaire
 * @param onChange - Le gestionnaire de changement
 * @param onTooltipChange - Le gestionnaire de tooltip
 * @returns JSX.Element | null - Le composant à rendre ou null si masqué
 */
const renderCustomDimension = (
  dimensionNumber: 1 | 2 | 3,
  customDimensions: CustomDimensionsState,
  dynamicLists: { [key: string]: ListItem[] },
  formData: any,
  onChange: any,
  onTooltipChange: any
): JSX.Element | null => {
  const fieldName = `TC_Custom_Dim_${dimensionNumber}` as const;
  const configuredLabel = customDimensions.configured[fieldName];
  const hasList = customDimensions.hasLists[fieldName];
  
  // Cas 3 : Dimension non configurée → Masqué
  if (!configuredLabel) {
    return null;
  }
  
  const labelText = configuredLabel || `Dimension personnalisée ${dimensionNumber}`;
  const helpText = "Champs personnalisé pour votre client";
  
  // Cas 1 : Dimension configurée + liste existe → SmartSelect
  if (hasList && dynamicLists[fieldName] && dynamicLists[fieldName].length > 0) {
    return (
      <SmartSelect
        key={fieldName}
        id={fieldName}
        name={fieldName}
        value={formData[fieldName] || ''}
        onChange={onChange}
        options={dynamicLists[fieldName].map(item => ({
          id: item.id,
          label: item.SH_Display_Name_FR
        }))}
        placeholder={`Sélectionner ${labelText}...`}
        label={createLabelWithHelp(labelText, helpText, onTooltipChange)}
      />
    );
  }
  
  // Cas 2 : Dimension configurée + pas de liste → FormInput
  return (
    <FormInput
      key={fieldName}
      id={fieldName}
      name={fieldName}
      value={formData[fieldName] || ''}
      onChange={onChange}
      type="text"
      placeholder={`Saisir ${labelText}...`}
      label={createLabelWithHelp(labelText, helpText, onTooltipChange)}
    />
  );
};

/**
 * Composant fonctionnel React pour le formulaire de stratégie média CORRIGÉ.
 */
const TactiqueFormStrategie = memo<TactiqueFormStrategieProps>(({
  formData,
  onChange,
  onTooltipChange,
  dynamicLists,
  visibleFields,
  customDimensions,
  publishersOptions, // DEPRECATED: Plus utilisé
  loading = false,
  isPublishersLoading = false // DEPRECATED: Plus utilisé
}) => {
  const isDisabled = loading;

  // NOUVEAU : Filtrage des publishers basé sur TC_Media_Type
  const filteredPublishers = useMemo(() => {
    if (!dynamicLists.TC_Publisher || !formData.TC_Media_Type) {
      return dynamicLists.TC_Publisher || [];
    }
    
    const targetPublisherType = getPublisherTypeFromMediaType(formData.TC_Media_Type);
    if (!targetPublisherType) {
      return dynamicLists.TC_Publisher;
    }
    
    return dynamicLists.TC_Publisher.filter(publisher => 
      publisher.SH_Type === targetPublisherType
    );
  }, [dynamicLists.TC_Publisher, formData.TC_Media_Type]);

  // NOUVEAU : Effet pour réinitialiser TC_Publisher si la valeur actuelle n'est plus valide
  useEffect(() => {
    if (formData.TC_Publisher && filteredPublishers.length > 0) {
      const isCurrentPublisherValid = filteredPublishers.some(
        publisher => publisher.id === formData.TC_Publisher
      );
      
      if (!isCurrentPublisherValid) {
        // Créer un événement synthétique pour réinitialiser la valeur
        const syntheticEvent = {
          target: {
            name: 'TC_Publisher',
            value: ''
          }
        } as React.ChangeEvent<HTMLSelectElement>;
        
        onChange(syntheticEvent);
      }
    }
  }, [filteredPublishers, formData.TC_Publisher, onChange]);

  // NOUVEAU : Vérifier si au moins une dimension personnalisée doit être affichée
  const hasAnyCustomDimension = 
    customDimensions.configured.TC_Custom_Dim_1 ||
    customDimensions.configured.TC_Custom_Dim_2 ||
    customDimensions.configured.TC_Custom_Dim_3;

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Stratégie média
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configuration stratégique et ciblage
        </p>
      </div>
      
      <div className="space-y-6">
        {(dynamicLists.TC_LOB && dynamicLists.TC_LOB.length > 0) && (
          <SmartSelect
            id="TC_LOB"
            name="TC_LOB"
            value={formData.TC_LOB || ''}
            onChange={onChange}
            options={dynamicLists.TC_LOB?.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            })) || []}
            placeholder="Sélectionner une ligne d'affaire..."
            label={createLabelWithHelp(
              'Ligne d\'affaire',
              'Liste personalisée pour votre client',
              onTooltipChange
            )}
          />
        )}
        
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
              'C\'est la catégorisation la plus importante. Cette caractéristique affectera le comportement de la tactique à plusieurs niveaux',
              onTooltipChange
            )}
          />
        )}
        
        {(dynamicLists.TC_Prog_Buying_Method && dynamicLists.TC_Prog_Buying_Method.length > 0 && (formData.TC_Media_Type === 'SH_R3Z3VC6B' || formData.TC_Media_Type === 'SEA')) && (
          <SmartSelect
            id="TC_Prog_Buying_Method"
            name="TC_Prog_Buying_Method"
            value={formData.TC_Prog_Buying_Method || ''}
            onChange={onChange}
            options={dynamicLists.TC_Prog_Buying_Method?.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            })) || []}
            placeholder="Sélectionner une méthode d'achat..."
            label={createLabelWithHelp(
              'Méthode d\'achat - Programmatique/SEM',
              "Indiquez quel genre d'achat programmatique ou SEM sera utilisé. Laissez vide si non applicable",
              onTooltipChange
            )}
          />
        )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">
          💡 Partenaire vs Inventaire
        </h5>
        <div className="text-sm text-blue-700 space-y-2">
          <div>
            <strong>Partenaire :</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• C'est l'entité qui facturera l'agence</li>
              <li>• Programmatique : c'est généralement la DSP (ex:DV360)</li>
              <li>• OOH : Si l'achat est effectué avec Billups, vous devez mettre Billups</li>
              <li>• TV/Radio : Si plusieurs stations seront utilisées, choisissez "Stations variées"</li>
              <li>• Chaque tactique doit obligatoirement avoir un partenaire</li>

            </ul>
          </div>
          <div>
            <strong>Inventaire :</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• C'est comme un sous-partenaire ou un média qu'on va activer à travers le partenaire</li>
              <li>• Si vous achetez un deal avec Radio-Canada à travers DV360, l'inventaire sera "Radio-Canada"</li>
              <li>• Lors d'un achat avec Billups, vous pouvez indiquer quel partenaire OOH sera utilisé (ex : Astral)</li>
              <li>• Si l'inventaire n'est pas applicable, laissez-le vide</li>


            </ul>
          </div>
        </div>
      </div>
        
        {/* MODIFIÉ : Publisher maintenant utilise filteredPublishers */}
        {(filteredPublishers && filteredPublishers.length > 0) && (
          <SmartSelect
            id="TC_Publisher"
            name="TC_Publisher"
            value={formData.TC_Publisher || ''}
            onChange={onChange}
            options={filteredPublishers.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            }))}
            placeholder="Sélectionner un partenaire..."
            label={createLabelWithHelp(
              'Partenaire',
              'IMPORTANT : C\'est l\'entité administrative qui envera la facture.',
              onTooltipChange
            )}
          />
        )}
        
        {(dynamicLists.TC_Inventory && dynamicLists.TC_Inventory.length > 0) && (
          <SmartSelect
            id="TC_Inventory"
            name="TC_Inventory"
            value={formData.TC_Inventory || ''}
            onChange={onChange}
            options={dynamicLists.TC_Inventory?.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            })) || []}
            placeholder="Sélectionner un inventaire..."
            label={createLabelWithHelp(
              'Inventaire',
              "Cette valeur est facultative. Il s'agit d'un sous-partenaire ou d'une propriété du partenaire (Ex : Pelmorex > Meteomedia",
              onTooltipChange
            )}
          />
        )}
        
        <FormTextarea
          id="TC_Market_Open"
          name="TC_Market_Open"
          value={formData.TC_Market_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder="Ex: Canada, Québec, Montréal"
          label={createLabelWithHelp(
            'Description du marché',
            "Champs ouvert. Utilisé uniquement dans le plan média. Ne sera pas utilisé dans la taxonomie",
            onTooltipChange
          )}
        />
        
        <FormTextarea
          id="TC_Targeting_Open"
          name="TC_Targeting_Open"
          value={formData.TC_Targeting_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder="Décrivez le ciblage de cette tactique..."
          label={createLabelWithHelp(
            'Description de l\'audience',
            "Champs ouvert. Utilisé uniquement dans le plan média. Ne sera pas utilisé dans la taxonomie",
            onTooltipChange
          )}
        />
        
        <FormTextarea
          id="TC_Product_Open"
          name="TC_Product_Open"
          value={formData.TC_Product_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder="Ex: iPhone 15 Pro"
          label={createLabelWithHelp(
            'Description du produit',
            "Champs ouvert. Utilisé uniquement dans le plan média. Ne sera pas utilisé dans la taxonomie",
            onTooltipChange
          )}
        />
        
        <FormTextarea
          id="TC_Format_Open"
          name="TC_Format_Open"
          value={formData.TC_Format_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder="Décrivez le format utilisé..."
          label={createLabelWithHelp(
            'Description du format',
            "Champs ouvert. Utilisé uniquement dans le plan média. Ne sera pas utilisé dans la taxonomie",
            onTooltipChange
          )}
        />
        
        <FormInput
          id="TC_Location_Open"
          name="TC_Location_Open"
          value={formData.TC_Location_Open || ''}
          onChange={onChange}
          type="text"
          placeholder="Décrivez l'emplacement"
          label={createLabelWithHelp(
            'Description de l\'emplacement',
            "Champs ouvert. Utilisé uniquement dans le plan média. Ne sera pas utilisé dans la taxonomie",
            onTooltipChange
          )}
        />
        
        <FormInput
          id="TC_Frequence"
          name="TC_Frequence"
          value={formData.TC_Frequence || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: 3 fois par semaine"
          label={createLabelWithHelp(
            'Fréquence',
            "Ex : 2x par semaine",
            onTooltipChange
          )}
        />
        
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
              "Champs fermé utilisé dans certaines taxonomies",
              onTooltipChange
            )}
          />
        )}
        
          <SmartSelect
            id="TC_Language_Open"
            name="TC_Language_Open"
            value={formData.TC_Language_Open || ''}
            onChange={onChange}
            options={dynamicLists.TC_Language_Open?.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            })) || []}
            placeholder="Sélectionner une langue..."
            label={createLabelWithHelp(
              'Langue',
              "Champs ouvert pour la langue de la tactique. Utilisé uniquement dans le plan média. La langue utilisée dans la taxonomie sera déterminée au niveau du placement",
              onTooltipChange
            )}
          />
      

        
      </div>

      {/* MODIFIÉ : Section des dimensions personnalisées avec logique corrigée */}
      {hasAnyCustomDimension && (
        <FormSection
          title="Champs personnalisés"
          description="Configuration spécifique au client"
        >
          {renderCustomDimension(1, customDimensions, dynamicLists, formData, onChange, onTooltipChange)}
          {renderCustomDimension(2, customDimensions, dynamicLists, formData, onChange, onTooltipChange)}
          {renderCustomDimension(3, customDimensions, dynamicLists, formData, onChange, onTooltipChange)}
        </FormSection>
      )}

      <FormSection
        title="Production"
        description="Gestion des créatifs et des livrables"
      >
        <FormInput
          id="TC_NumberCreative"
          name="TC_NumberCreative"
          value={formData.TC_NumberCreative || ''}
          onChange={onChange}
          type="text"
          placeholder="Ex: 5 bannières + 2 vidéos"
          label={createLabelWithHelp(
            'Nombre de créatifs suggérés',
            "Facultatif - Nombre de créatifs suggéré à produire pour l'agence de création",
            onTooltipChange
          )}
        />
        <FormInput
          id="TC_AssetDate"
          name="TC_AssetDate"
          value={formData.TC_AssetDate || ''}
          onChange={onChange}
          type="date"
          label={createLabelWithHelp(
            'Date de livraison des créatifs',
            'Facultatif - Date de livraison souhaitée pour assurer une mise en ligne à temps.',
            onTooltipChange
          )}
        />
      </FormSection>
    </div>
  );
});

TactiqueFormStrategie.displayName = 'TactiqueFormStrategie';

export default TactiqueFormStrategie;