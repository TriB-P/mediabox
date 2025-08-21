// app/components/Tactiques/Tactiques/TactiqueFormStrategie.tsx

/**
 * CORRIGÉ : Ce fichier contient le composant React TactiqueFormStrategie avec la logique 
 * des dimensions personnalisées corrigée pour implémenter les 3 comportements souhaités :
 * 1. Dimension configurée + liste existe → SmartSelect avec label personnalisé
 * 2. Dimension configurée + pas de liste → FormInput avec label personnalisé  
 * 3. Dimension non configurée → Masqué
 * * NOUVEAU : Ajout du filtrage dynamique des Publishers basé sur TC_Media_Type
 */
'use client';

import React, { memo, useMemo, useEffect } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
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
  TC_Prog_Buying_Method_1?: boolean;
  TC_Prog_Buying_Method_2?: boolean;
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
    TC_Prog_Buying_Method_1?: string;
    TC_Prog_Buying_Method_2?: string;
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
  onTooltipChange: any,
  t: (key: string, options?: any) => string
): JSX.Element | null => {
  const fieldName = `TC_Custom_Dim_${dimensionNumber}` as const;
  const configuredLabel = customDimensions.configured[fieldName];
  const hasList = customDimensions.hasLists[fieldName];
  
  // Cas 3 : Dimension non configurée → Masqué
  if (!configuredLabel) {
    return null;
  }
  
  const labelText = configuredLabel || t('tactiqueFormStrategie.customDimension.label', { number: dimensionNumber });
  const helpText = t('tactiqueFormStrategie.customDimension.helpText');
  
  // Cas 1 : Dimension configurée + liste existe → SmartSelect
  if (hasList && dynamicLists[fieldName] && dynamicLists[fieldName].length > 0) {
    return (
      <SmartSelect
        key={fieldName}
        id={fieldName}
        name={fieldName}
        value={formData[fieldName] || ''}
        onChange={onChange}
        items={dynamicLists[fieldName] || []}
        placeholder={t('tactiqueFormStrategie.customDimension.selectPlaceholder', { labelText })}
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
      placeholder={t('tactiqueFormStrategie.customDimension.inputPlaceholder', { labelText })}
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
  const { t } = useTranslation();
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
          {t('tactiqueFormStrategie.mediaStrategy.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('tactiqueFormStrategie.mediaStrategy.description')}
        </p>
      </div>
      
      <div className="space-y-6">
        {(dynamicLists.TC_LOB && dynamicLists.TC_LOB.length > 0) && (
          <SmartSelect
            id="TC_LOB"
            name="TC_LOB"
            value={formData.TC_LOB || ''}
            onChange={onChange}
            items={dynamicLists.TC_LOB || []}
            placeholder={t('tactiqueFormStrategie.lob.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.lob.label'),
              t('tactiqueFormStrategie.lob.helpText'),
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
            items={dynamicLists.TC_Media_Type || []}
            placeholder={t('tactiqueFormStrategie.mediaType.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.mediaType.label'),
              t('tactiqueFormStrategie.mediaType.helpText'),
              onTooltipChange
            )}
          />
        )}
        
        {(dynamicLists.TC_Prog_Buying_Method_1 && dynamicLists.TC_Prog_Buying_Method_1.length > 0 && (formData.TC_Media_Type === 'SH_R3Z3VC6B' || formData.TC_Media_Type === 'SEA')) && (
          <SmartSelect
            id="TC_Prog_Buying_Method_1"
            name="TC_Prog_Buying_Method_1"
            value={formData.TC_Prog_Buying_Method_1 || ''}
            onChange={onChange}
            items={dynamicLists.TC_Prog_Buying_Method_1 || []}
            placeholder={t('tactiqueFormStrategie.buyingMethod.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.buyingMethod.label'),
              t('tactiqueFormStrategie.buyingMethod.helpText'),
              onTooltipChange
            )}
          />
        )}


      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-800 mb-2">
          {t('tactiqueFormStrategie.infoBox.title')}
        </h5>
        <div className="text-sm text-blue-700 space-y-2">
          <div>
            <strong>{t('tactiqueFormStrategie.infoBox.partnerTitle')}</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>{t('tactiqueFormStrategie.infoBox.partnerBullet1')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.partnerBullet2')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.partnerBullet3')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.partnerBullet4')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.partnerBullet5')}</li>

            </ul>
          </div>
          <div>
            <strong>{t('tactiqueFormStrategie.infoBox.inventoryTitle')}</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>{t('tactiqueFormStrategie.infoBox.inventoryBullet1')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.inventoryBullet2')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.inventoryBullet3')}</li>
              <li>{t('tactiqueFormStrategie.infoBox.inventoryBullet4')}</li>


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
            items={filteredPublishers || []}
            placeholder={t('tactiqueFormStrategie.publisher.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.publisher.label'),
              t('tactiqueFormStrategie.publisher.helpText'),
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
            items={dynamicLists.TC_Inventory || []}
            placeholder={t('tactiqueFormStrategie.inventory.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.inventory.label'),
              t('tactiqueFormStrategie.inventory.helpText'),
              onTooltipChange
            )}
          />
        )}


{(dynamicLists.TC_Prog_Buying_Method_2 && dynamicLists.TC_Prog_Buying_Method_2.length > 0 && formData.TC_Media_Type === 'SH_R3Z3VC6B') && (
          <SmartSelect
            id="TC_Prog_Buying_Method_2"
            name="TC_Prog_Buying_Method_2"
            value={formData.TC_Prog_Buying_Method_2 || ''}
            onChange={onChange}
            items={dynamicLists.TC_Prog_Buying_Method_2 || []}
            placeholder={t('tactiqueFormStrategie.buyingMethod_2.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.buyingMethod_2.label'),
              t('tactiqueFormStrategie.buyingMethod_2.helpText'),
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
          placeholder={t('tactiqueFormStrategie.marketDescription.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.marketDescription.label'),
            t('tactiqueFormStrategie.common.openFieldHelpText'),
            onTooltipChange
          )}
        />
        
        <FormTextarea
          id="TC_Targeting_Open"
          name="TC_Targeting_Open"
          value={formData.TC_Targeting_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder={t('tactiqueFormStrategie.audienceDescription.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.audienceDescription.label'),
            t('tactiqueFormStrategie.common.openFieldHelpText'),
            onTooltipChange
          )}
        />
        
        <FormTextarea
          id="TC_Product_Open"
          name="TC_Product_Open"
          value={formData.TC_Product_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder={t('tactiqueFormStrategie.productDescription.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.productDescription.label'),
            t('tactiqueFormStrategie.common.openFieldHelpText'),
            onTooltipChange
          )}
        />
        
        <FormTextarea
          id="TC_Format_Open"
          name="TC_Format_Open"
          value={formData.TC_Format_Open || ''}
          onChange={onChange}
          rows={2}
          placeholder={t('tactiqueFormStrategie.formatDescription.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.formatDescription.label'),
            t('tactiqueFormStrategie.common.openFieldHelpText'),
            onTooltipChange
          )}
        />
        
        <FormInput
          id="TC_Location_Open"
          name="TC_Location_Open"
          value={formData.TC_Location_Open || ''}
          onChange={onChange}
          type="text"
          placeholder={t('tactiqueFormStrategie.locationDescription.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.locationDescription.label'),
            t('tactiqueFormStrategie.common.openFieldHelpText'),
            onTooltipChange
          )}
        />
        
        <FormInput
          id="TC_Frequence"
          name="TC_Frequence"
          value={formData.TC_Frequence || ''}
          onChange={onChange}
          type="text"
          placeholder={t('tactiqueFormStrategie.frequency.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.frequency.label'),
            t('tactiqueFormStrategie.frequency.helpText'),
            onTooltipChange
          )}
        />
        
        {(dynamicLists.TC_Market && dynamicLists.TC_Market.length > 0) && (
          <SmartSelect
            id="TC_Market"
            name="TC_Market"
            value={formData.TC_Market || ''}
            onChange={onChange}
            items={dynamicLists.TC_Market || []}
            placeholder={t('tactiqueFormStrategie.market.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.market.label'),
              t('tactiqueFormStrategie.market.helpText'),
              onTooltipChange
            )}
          />
        )}
        
          <SmartSelect
            id="TC_Language_Open"
            name="TC_Language_Open"
            value={formData.TC_Language_Open || ''}
            onChange={onChange}
            items={dynamicLists.TC_Language_Open || []}
            placeholder={t('tactiqueFormStrategie.language.placeholder')}
            label={createLabelWithHelp(
              t('tactiqueFormStrategie.language.label'),
              t('tactiqueFormStrategie.language.helpText'),
              onTooltipChange
            )}
          />
      

        
      </div>

      {/* MODIFIÉ : Section des dimensions personnalisées avec logique corrigée */}
      {hasAnyCustomDimension && (
        <FormSection
          title={t('tactiqueFormStrategie.customFields.title')}
          description={t('tactiqueFormStrategie.customFields.description')}
        >
          {renderCustomDimension(1, customDimensions, dynamicLists, formData, onChange, onTooltipChange, t)}
          {renderCustomDimension(2, customDimensions, dynamicLists, formData, onChange, onTooltipChange, t)}
          {renderCustomDimension(3, customDimensions, dynamicLists, formData, onChange, onTooltipChange, t)}
        </FormSection>
      )}

      <FormSection
        title={t('tactiqueFormStrategie.production.title')}
        description={t('tactiqueFormStrategie.production.description')}
      >
        <FormInput
          id="TC_NumberCreative"
          name="TC_NumberCreative"
          value={formData.TC_NumberCreative || ''}
          onChange={onChange}
          type="text"
          placeholder={t('tactiqueFormStrategie.creatives.placeholder')}
          label={createLabelWithHelp(
            t('tactiqueFormStrategie.creatives.label'),
            t('tactiqueFormStrategie.creatives.helpText'),
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
            t('tactiqueFormStrategie.deliveryDate.label'),
            t('tactiqueFormStrategie.deliveryDate.helpText'),
            onTooltipChange
          )}
        />
      </FormSection>
    </div>
  );
});

TactiqueFormStrategie.displayName = 'TactiqueFormStrategie';

export default TactiqueFormStrategie;