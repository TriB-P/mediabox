// app/components/AdOps/AdOpsTableRow.tsx
/**
 * Composant AdOpsTableRow avec intégration CM360
 * Gère l'affichage d'une ligne du tableau avec indicateurs de changements
 * et modal d'historique pour les valeurs modifiées.
 * CORRIGÉ : Formatage des dates sans décalage de fuseau horaire
 * AMÉLIORÉ : Indicateur CM360 agrandi
 * NOUVEAU : Support expansion colonnes tags
 */
'use client';

import { useTranslation } from '../../contexts/LanguageContext';
import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  CheckIcon,
  ExclamationTriangleIcon ,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import AdOpsActionButtons from './AdOpsActionButtons';
import CM360HistoryModal from './CM360HistoryModal';
import { CM360TagHistory, CM360TagData } from '../../lib/cm360Service';

interface TableRow {
  type: 'placement' | 'creative';
  level: number;
  data: any;
  placementId?: string;
  isExpanded?: boolean;
  children?: TableRow[];
}

interface AdOpsTableRowProps {
  row: TableRow;
  index: number;
  isSelected: boolean;
  onToggleExpanded: (placementId: string) => void;
  onRowSelection: (rowId: string, index: number, event: React.MouseEvent) => void;
  selectedTactique: any;
  selectedCampaign: any;
  selectedVersion: any;
  selectedRows: Set<string>;
  // Nouvelles props pour CM360
  cm360History?: CM360TagHistory;
  cm360Status: 'none' | 'created' | 'changed';
  cm360Tags?: Map<string, CM360TagHistory>; // Nouveau prop
  // NOUVEAU : Support expansion colonnes tags
  isTagColumnsExpanded?: boolean;
}

/**
 * Composant pour une ligne du tableau AdOps avec support CM360
 */
export default function AdOpsTableRow({
  row,
  index,
  isSelected,
  onToggleExpanded,
  onRowSelection,
  selectedTactique,
  selectedCampaign,
  selectedVersion,
  selectedRows,
  cm360History,
  cm360Status,
  cm360Tags,
  isTagColumnsExpanded = false // NOUVEAU : Défaut à false
}: AdOpsTableRowProps) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    fieldName: string;
    fieldLabel: string;
  }>({
    isOpen: false,
    fieldName: '',
    fieldLabel: ''
  });

  /**
   * Copie une valeur dans le presse-papiers avec feedback
   */
  const copyToClipboard = async (value: string | number | boolean | undefined, fieldName: string) => {
    if (value === undefined || value === null) return;
    
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  /**
   * Ouvre le modal d'historique pour un champ spécifique
   */
  const openHistoryModal = (fieldName: string, fieldLabel: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setModalState({
      isOpen: true,
      fieldName,
      fieldLabel
    });
  };

  /**
   * Ferme le modal d'historique
   */
  const closeHistoryModal = () => {
    setModalState({
      isOpen: false,
      fieldName: '',
      fieldLabel: ''
    });
  };

  /**
   * Vérifie si un champ a été modifié
   */
  const isFieldChanged = (fieldName: string): boolean => {
    if (!cm360History?.changedFields) return false;
    return cm360History.changedFields.includes(fieldName);
  };

  /**
   * Composant pour une cellule avec support CM360
   */
  const CM360Cell = ({ 
    value, 
    fieldName, 
    fieldLabel,
    className = '',
    isClickable = true 
  }: { 
    value: any; 
    fieldName: string; 
    fieldLabel: string;
    className?: string; 
    isClickable?: boolean;
  }) => {
    const isCopied = copiedField === fieldName;
    const isChanged = isFieldChanged(fieldName);
    const displayValue = value === undefined || value === null ? '-' : String(value);
    const isEmpty = value === undefined || value === null;
    
    return (
      <td className={`px-6 py-4 whitespace-nowrap text-sm relative ${className}`}>
        <div className="flex items-center gap-1">
          {/* Valeur principale */}
          <span 
            className={`cursor-pointer hover:bg-gray-100 px-1 py-1 rounded transition-colors ${
              isEmpty ? 'text-gray-400' : 'text-gray-900'
            }`}
            onClick={() => isClickable && copyToClipboard(value, fieldName)}
            title={t('tableRow.clickToCopy')}
          >
            {displayValue}
          </span>
          
          {/* Indicateur de copie */}
          {isCopied && (
            <CheckIcon className="w-4 h-4 text-green-600 animate-pulse" />
          )}
          
          {/* Indicateur de changement CM360 */}
          {isChanged && cm360History && (
            <button
              onClick={(e) => openHistoryModal(fieldName, fieldLabel, e)}
              className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
              title={`${fieldLabel} ${t('tableRow.modifiedSinceLastTag')} - ${t('tableRow.clickToSeeHistory')}`}
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    );
  };

  /**
   * Formate les valeurs booléennes
   */
  const formatBoolean = (value: boolean | undefined): string => {
    if (value === undefined || value === null) return '-';
    return value ? t('common.yes') : t('common.no');
  };

  /**
   * CORRIGÉ : Formate les dates sans décalage de fuseau horaire
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      // CORRIGÉ : Forcer l'interprétation locale pour éviter le décalage UTC
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Créer la date en local (année, mois-1, jour)
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Les mois commencent à 0 en JS
        const day = parseInt(parts[2]);
        const localDate = new Date(year, month, day);
        return localDate.toLocaleDateString('fr-CA');
      }
      // Fallback pour autres formats
      return dateString;
    } catch {
      return dateString;
    }
  };

  /**
   * Détermine la couleur de fond de la ligne
   */
  const getRowBackgroundStyle = (): React.CSSProperties => {
    const colorValue = row.type === 'placement' 
      ? row.data.PL_Adops_Color 
      : row.data.CR_Adops_Color;
    
    if (!colorValue) return {};
    
    return {
      backgroundColor: colorValue
    };
  };

  /**
   * Vérifie si un placement a des créatifs sélectionnés
   */
  const hasSelectedChildren = (): boolean => {
    if (row.type !== 'placement' || !row.children) return false;
    
    return row.children.some(child => 
      selectedRows.has(`creative-${child.data.id}`)
    );
  };

  /**
   * Détermine si la ligne a une couleur personnalisée
   */
  const hasCustomColor = (): boolean => {
    const colorValue = row.type === 'placement' 
      ? row.data.PL_Adops_Color 
      : row.data.CR_Adops_Color;
    return !!colorValue;
  };

  const rowId = `${row.type}-${row.data.id}`;
  const isPlacement = row.type === 'placement';
  const isCreative = row.type === 'creative';
  const hasChildren = isPlacement && row.children && row.children.length > 0;
  const backgroundStyle = getRowBackgroundStyle();
  const customColor = hasCustomColor();

  return (
    <>
      <tr 
        className={`
          ${isSelected ? '' : (!customColor ? 'hover:bg-gray-50' : '')}
          ${isCreative ? 'border-l-4 border-l-gray-300' : ''}
          transition-colors duration-150
        `}
        style={backgroundStyle}
      >
        {/* Checkbox */}
        <td className="w-8 px-2 py-4">
          <div 
            className="flex items-center justify-center cursor-pointer"
            onClick={(e) => onRowSelection(rowId, index, e)}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
            />
          </div>
        </td>

        {/* Statut CM360 - AMÉLIORÉ : Indicateurs agrandis */}
        <td className="w-6 px-2 py-4">
          <div className="flex items-center justify-center">
            {cm360Status === 'created' && (
              <CheckCircleIcon 
                className="w-6 h-6 text-green-600 flex items-center justify-center text-lg font-bold"
                title={t('tableRow.tagCreatedInCm360')}
              />
            
            )}
            {cm360Status === 'changed' && (
              <ExclamationTriangleIcon 
                className="w-6 h-6 text-red-600" 
                title={t('tableRow.changesDetectedSinceLastTag')}
              />
            )}
          </div>
        </td>

        {/* Label avec indentation et expansion */}
        <td className="py-4 whitespace-nowrap text-sm font-medium">
          <div className={`flex items-center ${isCreative ? 'ml-6' : ''}`}>
            {isPlacement && hasChildren && (
              <button
                onClick={() => onToggleExpanded(row.data.id)}
                className="mr-2 p-1 rounded hover:bg-gray-200"
              >
                {row.isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
        
            
            <div className="flex items-center gap-1">
              <span
                className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                  isCreative ? 'text-gray-600 text-sm' : 'text-gray-900'
                }`}
                onClick={() => copyToClipboard(
                  isPlacement ? row.data.PL_Label : row.data.CR_Label, 
                  'label'
                )}
                title={t('tableRow.clickToCopy')}
              >
                {isPlacement ? (row.data.PL_Label || t('tableRow.unnamedPlacement')) : (row.data.CR_Label || t('tableRow.unnamedCreative'))}
              </span>
              
              {copiedField === 'label' && (
                <CheckIcon className="w-4 h-4 text-green-600 animate-pulse" />
              )}
              
              {/* Indicateur de changement pour le label */}
              {isFieldChanged(isPlacement ? 'PL_Label' : 'CR_Label') && cm360History && (
                <button
                  onClick={(e) => openHistoryModal(
                    isPlacement ? 'PL_Label' : 'CR_Label',
                    t('tableRow.label'),
                    e
                  )}
                  className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                  title={`${t('tableRow.labelModified')} - ${t('tableRow.clickToSeeHistory')}`}
                >
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </button>
              )}

            {isPlacement && hasChildren && (
              <span className={`mr-2 text-xs px-2 py-1 rounded-full ${
                hasSelectedChildren() 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {row.children?.length}
                {hasSelectedChildren()}
              </span>
            )}
            </div>
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap">
          <AdOpsActionButtons
            rowType={row.type}
            data={row.data}
            selectedTactique={selectedTactique}
            selectedCampaign={selectedCampaign}
            selectedVersion={selectedVersion}
            cm360History={cm360History}
            cm360Tags={cm360Tags}
          />
        </td>

        {/* NOUVEAU : Colonnes tags conditionnelles */}
        {isTagColumnsExpanded && (
          <>
            {/* Tag 1 - PL_Tag_1 ou CR_Tag_5 */}
            <CM360Cell 
              value={isPlacement ? row.data.PL_Tag_1 : row.data.CR_Tag_5} 
              fieldName={isPlacement ? 'PL_Tag_1' : 'CR_Tag_5'}
              fieldLabel="Campaign / Creative"
            />

            {/* Tag 2 - PL_Tag_2 ou CR_Tag_6 */}
            <CM360Cell 
              value={isPlacement ? row.data.PL_Tag_2 : row.data.CR_Tag_6} 
              fieldName={isPlacement ? 'PL_Tag_2' : 'CR_Tag_6'}
              fieldLabel="Placement / UTM"
            />

            {/* Tag 3 - PL_Tag_3 ou vide pour créatifs */}
            <CM360Cell 
              value={isPlacement ? row.data.PL_Tag_3 : undefined} 
              fieldName={isPlacement ? 'PL_Tag_3' : ''}
              fieldLabel="Ad"
              isClickable={isPlacement}
            />
          </>
        )}

        {/* Tag Type avec support CM360 */}
        <CM360Cell 
          value={isPlacement ? row.data.PL_Tag_Type : '-'} 
          fieldName="PL_Tag_Type"
          fieldLabel={t('tableRow.tagType')}
          isClickable={isPlacement}
        />

        {/* Date Début avec support CM360 - CORRIGÉ */}
        <CM360Cell 
          value={formatDate(isPlacement ? row.data.PL_Tag_Start_Date : row.data.CR_Tag_Start_Date)} 
          fieldName={isPlacement ? 'PL_Tag_Start_Date' : 'CR_Tag_Start_Date'}
          fieldLabel={t('tableRow.startDate')}
        />

        {/* Date Fin avec support CM360 - CORRIGÉ */}
        <CM360Cell 
          value={formatDate(isPlacement ? row.data.PL_Tag_End_Date : row.data.CR_Tag_End_Date)} 
          fieldName={isPlacement ? 'PL_Tag_End_Date' : 'CR_Tag_End_Date'}
          fieldLabel={t('tableRow.endDate')}
        />

        {/* Rotation Type / Weight avec support CM360 */}
        <CM360Cell 
          value={isPlacement ? row.data.PL_Rotation_Type : row.data.CR_Rotation_Weight} 
          fieldName={isPlacement ? 'PL_Rotation_Type' : 'CR_Rotation_Weight'}
          fieldLabel={isPlacement ? t('tableRow.rotationType') : t('tableRow.rotationWeight')}
        />

        {/* Floodlight avec support CM360 */}
        <CM360Cell 
          value={isPlacement ? row.data.PL_Floodlight : '-'} 
          fieldName="PL_Floodlight"
          fieldLabel={t('tableRow.floodlight')}
          isClickable={isPlacement}
        />

        {/* Third Party Measurement avec support CM360 */}
        <CM360Cell 
          value={formatBoolean(isPlacement ? row.data.PL_Third_Party_Measurement : undefined)} 
          fieldName="PL_Third_Party_Measurement"
          fieldLabel={t('tableRow.thirdPartyMeasurement')}
          isClickable={isPlacement}
        />

        {/* VPAID avec support CM360 */}
        <CM360Cell 
          value={formatBoolean(isPlacement ? row.data.PL_VPAID : undefined)} 
          fieldName="PL_VPAID"
          fieldLabel={t('tableRow.vpaid')}
          isClickable={isPlacement}
        />
      </tr>

      {/* Modal d'historique CM360 */}
      {modalState.isOpen && cm360History && (
        <CM360HistoryModal
          isOpen={modalState.isOpen}
          onClose={closeHistoryModal}
          fieldName={modalState.fieldName}
          fieldLabel={modalState.fieldLabel}
          currentValue={row.data[modalState.fieldName]}
          tags={cm360History.tags}
          itemType={row.type}
          itemLabel={isPlacement ? row.data.PL_Label : row.data.CR_Label}
          cm360Tags={cm360Tags}
        />
      )}
    </>
  );
}