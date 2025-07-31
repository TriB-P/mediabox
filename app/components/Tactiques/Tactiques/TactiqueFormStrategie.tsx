// app/components/Tactiques/Tactiques/TactiqueFormStrategie.tsx

/**
 * Ce fichier contient le composant React TactiqueFormStrategie.
 * Il s'agit d'un formulaire qui permet de configurer les aspects stratégiques et de ciblage d'une tactique média.
 * Le formulaire inclut des champs pour la ligne d'affaire, le type de média, le partenaire, l'inventaire,
 * diverses descriptions textuelles (marché, ciblage, produit, format, emplacement), la fréquence, le marché et la langue.
 * Il gère également l'affichage conditionnel de champs personnalisés et des informations relatives à la production.
 *
 */
'use client';

import React, { memo } from 'react';
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
  TC_Language_Open?: boolean;
}

interface TactiqueFormStrategieProps {
  formData: {
    TC_LoB?: string;
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
    TC_Buying_Method?: string;
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
  customDimensions: ClientCustomDimensions;
  publishersOptions: { id: string; label: string }[]; // DEPRECATED: Plus utilisé mais gardé pour compatibilité
  loading?: boolean;
  isPublishersLoading?: boolean; // DEPRECATED: Plus utilisé mais gardé pour compatibilité
}

/**
 * Composant fonctionnel React pour le formulaire de stratégie média.
 *
 * @param {TactiqueFormStrategieProps} props - Les propriétés du composant.
 * @param {object} props.formData - Les données actuelles du formulaire.
 * @param {function} props.onChange - Le gestionnaire de changement pour les champs du formulaire.
 * @param {function} props.onTooltipChange - Le gestionnaire pour afficher/masquer les infobulles.
 * @param {object} props.dynamicLists - Les listes dynamiques utilisées pour les sélections.
 * @param {object} props.visibleFields - Un objet indiquant quels champs doivent être visibles.
 * @param {object} props.customDimensions - Les noms des dimensions personnalisées du client.
 * @param {Array} props.publishersOptions - DEPRECATED: Plus utilisé (TC_Publisher via dynamicLists maintenant).
 * @param {boolean} [props.loading=false] - Indique si le formulaire est en état de chargement global.
 * @param {boolean} [props.isPublishersLoading=false] - DEPRECATED: Plus utilisé.
 * @returns {JSX.Element} Le composant de formulaire de stratégie média.
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
        {(dynamicLists.TC_Publisher && dynamicLists.TC_Publisher.length > 0) && (
          <SmartSelect
            id="TC_Publisher"
            name="TC_Publisher"
            value={formData.TC_Publisher || ''}
            onChange={onChange}
            options={dynamicLists.TC_Publisher?.map(item => ({
              id: item.id,
              label: item.SH_Display_Name_FR
            })) || []}
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
        {(dynamicLists.TC_Language_Open && dynamicLists.TC_Language_Open.length > 0) && (
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
              "Champs fermé utilisé dans certaines taxonomies",
              onTooltipChange
            )}
          />
        )}
      </div>
      {(visibleFields.TC_Custom_Dim_1 || visibleFields.TC_Custom_Dim_2 ||
        visibleFields.TC_Custom_Dim_3 || visibleFields.TC_Buying_Method) && (
          <FormSection
            title="Champs personnalisés"
            description="Configuration spécifique au client"
          >
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
                  "Champs personnalisé pour votre client",
                  onTooltipChange
                )}
              />
            )}
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
                  "Champs personnalisé pour votre client",
                  onTooltipChange
                )}
              />
            )}
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
                  "Champs personnalisé pour votre client",
                  onTooltipChange
                )}
              />
            )}
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
                  "Champs personnalisé pour votre client",
                  onTooltipChange
                )}
              />
            )}
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