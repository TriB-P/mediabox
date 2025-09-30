// app/components/AdOps/AdOpsTableRow.tsx
/**
 * Composant ligne du tableau AdOps unifié et nettoyé
 * CORRIGÉ : Types unifiés, logique simplifiée, performance optimisée
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import AdOpsActionButtons from './AdOpsActionButtons';
import CM360HistoryModal from './CM360HistoryModal';
import { CM360TagHistory } from '../../lib/cm360Service';
import { useTranslation } from '../../contexts/LanguageContext';

// Import des types unifiés
import {
  AdOpsTactique,
  AdOpsPlacement,
  AdOpsCreative,
  AdOpsTableRowProps,
  AdOpsItemType,
  isAdOpsTactique,
  isAdOpsPlacement,
  isAdOpsCreative
} from '../../types/adops';

// ================================
// COMPOSANTS UTILITAIRES
// ================================

/**
 * Badge de type d'élément optimisé
 */
const TypeBadge = React.memo(({ type }: { type: AdOpsItemType }) => {
  const badgeConfig = useMemo(() => ({
    tactique: {
      label: 'TAC',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    placement: {
      label: 'PLA',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    creative: {
      label: 'CRE',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  }), []);

  const config = badgeConfig[type];
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
});

TypeBadge.displayName = 'TypeBadge';

/**
 * Indicateur de statut CM360 optimisé
 */
const CM360StatusIndicator = React.memo(({ status }: { status: string }) => {
  if (status === 'created') {
    return <CheckCircleIcon className="w-6 h-6 text-green-600" title="Tags créés et à jour" />;
  }
  
  if (status === 'changed' || status === 'partial') {
    return <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" title="Changements détectés" />;
  }
  
  if (status === 'none') {
    return <div className="w-2 h-2 bg-gray-300 rounded-full" title="Aucun tag créé" />;
  }
  
  return null;
});

CM360StatusIndicator.displayName = 'CM360StatusIndicator';

// ================================
// COMPOSANT CELLULE CM360
// ================================

interface CM360CellProps {
  value: any;
  fieldName: string;
  fieldLabel: string;
  cm360History?: CM360TagHistory;
  rowId: string;
  rowType: AdOpsItemType;
  itemLabel: string;
  cm360Tags?: Map<string, CM360TagHistory>;
  copiedField: string | null;
  onCopyToClipboard: (value: any, fieldId: string) => void;
  className?: string;
}

/**
 * Cellule avec indicateurs de changement CM360 cliquables
 */
const CM360Cell = React.memo(({ 
  value, 
  fieldName, 
  fieldLabel,
  cm360History,
  rowId,
  rowType,
  itemLabel,
  cm360Tags,
  copiedField,
  onCopyToClipboard,
  className = '' 
}: CM360CellProps) => {
  const { t } = useTranslation();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    fieldName: string;
    fieldLabel: string;
  }>({
    isOpen: false,
    fieldName: '',
    fieldLabel: ''
  });

  // Mémoisation des calculs
  const cellData = useMemo(() => {
    const isChanged = cm360History?.changedFields?.includes(fieldName) || false;
    const displayValue = value === undefined || value === null ? '-' : String(value);
    const isEmpty = value === undefined || value === null;
    const cellId = `${rowId}-${fieldName}`;

    return {
      isChanged,
      displayValue,
      isEmpty,
      cellId
    };
  }, [cm360History?.changedFields, fieldName, value, rowId]);

  const openHistoryModal = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setModalState({
      isOpen: true,
      fieldName,
      fieldLabel
    });
  }, [fieldName, fieldLabel]);

  const closeHistoryModal = useCallback(() => {
    setModalState({
      isOpen: false,
      fieldName: '',
      fieldLabel: ''
    });
  }, []);

  const handleCopy = useCallback(() => {
    onCopyToClipboard(value, cellData.cellId);
  }, [value, cellData.cellId, onCopyToClipboard]);

  return (
    <>
      <td className={`px-6 py-4 whitespace-nowrap text-sm relative ${className}`}>
        <div className="flex items-center gap-1">
          <span 
            className={`cursor-pointer hover:bg-gray-100 px-1 py-1 rounded transition-colors ${
              cellData.isEmpty ? 'text-gray-400' : 'text-gray-900'
            } ${cellData.isChanged ? 'bg-red-50 text-red-900 ring-1 ring-red-200' : ''}`}
            onClick={handleCopy}
            title={cellData.isChanged ? `${fieldLabel} modifié depuis dernier tag CM360` : 'Cliquer pour copier'}
          >
            {cellData.displayValue}
          </span>
          
          {copiedField === cellData.cellId && (
            <CheckIcon className="w-4 h-4 text-green-600 animate-pulse" />
          )}
          
          {cellData.isChanged && cm360History && (
            <button
              onClick={openHistoryModal}
              className="text-orange-600 hover:text-orange-800 transition-colors p-1 rounded hover:bg-orange-50 flex-shrink-0"
              title={`${fieldLabel} a changé - Cliquer pour voir l'historique`}
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>

      {modalState.isOpen && cm360History && (
        <CM360HistoryModal
          isOpen={modalState.isOpen}
          onClose={closeHistoryModal}
          fieldName={modalState.fieldName}
          fieldLabel={modalState.fieldLabel}
          currentValue={value}
          tags={cm360History.tags}
          itemType={rowType}
          itemLabel={itemLabel}
          cm360Tags={cm360Tags}
        />
      )}
    </>
  );
});

CM360Cell.displayName = 'CM360Cell';

// ================================
// COMPOSANT PRINCIPAL
// ================================

/**
 * Composant ligne du tableau optimisé
 */
export default function AdOpsTableRow({
  row,
  index,
  isSelected,
  selectedTactiques,
  selectedCampaign,
  selectedVersion,
  cm360Status,
  cm360History,
  cm360Tags,
  showBudgetParams,
  showTaxonomies,
  copiedField,
  onRowSelection,
  onToggleExpanded,
  onCopyToClipboard,
  formatCurrency,
  formatNumber,
  formatDate
}: AdOpsTableRowProps) {
  const { t } = useTranslation();

  // Mémoisation des calculs coûteux
  const rowData = useMemo(() => {
    const rowId = `${row.type}-${row.data.id}`;
    const hasChildren = row.children && row.children.length > 0;
    
    // Label selon le type avec type guards
    let itemLabel = 'Élément sans nom';
    if (isAdOpsTactique(row.data)) {
      itemLabel = row.data.TC_Label || 'Tactique sans nom';
    } else if (isAdOpsPlacement(row.data)) {
      itemLabel = row.data.PL_Label || 'Placement sans nom';
    } else if (isAdOpsCreative(row.data)) {
      itemLabel = row.data.CR_Label || 'Créatif sans nom';
    }

    return {
      rowId,
      hasChildren,
      itemLabel
    };
  }, [row.type, row.data, row.children]);

  // Styles de ligne mémorisés
  const rowStyles = useMemo((): { className: string; style: React.CSSProperties } => {
    let className = 'transition-colors ';
    let style: React.CSSProperties = {};
    
    // Couleur utilisateur (prioritaire)
    let userColor: string | undefined;
    if (isAdOpsTactique(row.data)) {
      userColor = row.data.TC_Adops_Color;
    } else if (isAdOpsPlacement(row.data)) {
      userColor = row.data.PL_Adops_Color;
    } else if (isAdOpsCreative(row.data)) {
      userColor = row.data.CR_Adops_Color;
    }
    
    if (userColor) {
      style.backgroundColor = userColor;
      className += 'text-gray-900 ';
    } else {
      // CORRIGÉ : Toutes les lignes en blanc avec bordures distinctives
      if (row.type === 'tactique') {
        className += ' border-l-4 border-l-gray-300 ';
      } else if (row.type === 'placement') {
        className += ' border-l-4 border-l-gray-300 ';
      } else {
        className += ' border-l-4 border-l-gray-300 ';
      }
    }
    
    // État de sélection
    if (isSelected) {
      className += ' bg-indigo-50 ';
    } else {
      className += 'hover:bg-gray-50 ';
    }
    
    return { className, style };
  }, [row.type, row.data, isSelected]);

  // Gestionnaires d'événements mémorisés
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    onRowSelection(rowData.rowId, index, e);
  }, [onRowSelection, rowData.rowId, index]);

  const handleToggleExpand = useCallback(() => {
    onToggleExpanded(rowData.rowId, row.type);
  }, [onToggleExpanded, rowData.rowId, row.type]);

  const handleLabelCopy = useCallback(() => {
    onCopyToClipboard(rowData.itemLabel, `${rowData.rowId}-label`);
  }, [onCopyToClipboard, rowData.itemLabel, rowData.rowId]);

  // Fonction pour obtenir la valeur d'un champ selon le type
  const getFieldValue = useCallback((fieldName: string, defaultValue: any = '-'): any => {
    if (row.type === 'tactique' && isAdOpsTactique(row.data)) {
      const tactique = row.data;
      switch (fieldName) {
        case 'budget': return formatCurrency(tactique.TC_Media_Budget, tactique.TC_BuyCurrency);
        case 'rate': return formatCurrency(tactique.TC_CM360_Rate, tactique.TC_BuyCurrency);
        case 'volume': return formatNumber(tactique.TC_CM360_Volume);
        case 'currency': return tactique.TC_BuyCurrency || 'N/A';
        case 'buyType': return tactique.TC_Buy_Type || 'N/A';
        default: return defaultValue;
      }
    }
    
    if (row.type === 'placement' && isAdOpsPlacement(row.data)) {
      const placement = row.data;
      switch (fieldName) {
        case 'tagType': return placement.PL_Tag_Type || defaultValue;
        case 'startDate': return formatDate(placement.PL_Tag_Start_Date);
        case 'endDate': return formatDate(placement.PL_Tag_End_Date);
        case 'rotation': return placement.PL_Rotation_Type || defaultValue;
        case 'floodlight': return placement.PL_Floodlight || defaultValue;
        case 'thirdParty': return placement.PL_Third_Party_Measurement ? t('common.yes') : t('common.no');
        case 'vpaid': return placement.PL_VPAID ? t('common.yes') : t('common.no');
        case 'tag1': return placement.PL_Tag_1;
        case 'tag2': return placement.PL_Tag_3;
        case 'tag3': return placement.PL_Tag_4;
        default: return defaultValue;
      }
    }
    
    if (row.type === 'creative' && isAdOpsCreative(row.data)) {
      const creative = row.data;
      switch (fieldName) {
        case 'startDate': return formatDate(creative.CR_Tag_Start_Date);
        case 'endDate': return formatDate(creative.CR_Tag_End_Date);
        case 'rotation': return creative.CR_Rotation_Weight || defaultValue;
        case 'tag1': return creative.CR_Tag_5;
        case 'tag2': return creative.CR_Tag_6;
        default: return defaultValue;
      }
    }
    
    return defaultValue;
  }, [row.type, row.data, formatCurrency, formatNumber, formatDate, t]);

  return (
    <tr className={rowStyles.className} style={rowStyles.style}>
      {/* Checkbox de sélection */}
      <td className="w-8 px-2 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={handleRowClick}
          readOnly
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </td>

      {/* Statut CM360 */}
      <td className="w-6 px-2 py-4">
        <div className="flex items-center justify-center">
          <CM360StatusIndicator status={cm360Status} />
        </div>
      </td>

      {/* Label avec indentation et expansion */}
      <td className="py-4 whitespace-nowrap text-sm">
        <div className={`flex items-center gap-3 ${
          row.level === 1 ? 'ml-5' : row.level === 2 ? 'ml-16' : ''
        }`}>
          {rowData.hasChildren && (
            <button
              onClick={handleToggleExpand}
              className="mr-2 p-1 rounded hover:bg-gray-200"
            >
              {row.isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          <TypeBadge type={row.type} />
          
          <div className="flex items-center gap-1">
            <span 
              className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                row.type === 'tactique' ? 'font-bold text-gray-900' :
                row.type === 'placement' ? 'font-medium text-gray-800' :
                'font-normal text-gray-600'
              }`}
              onClick={handleLabelCopy}
            >
              {rowData.itemLabel}
            </span>
            
            {copiedField === `${rowData.rowId}-label` && (
              <CheckIcon className="w-4 h-4 text-green-600 animate-pulse" />
            )}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="w-80 px-6 py-4">
        {row.type !== 'tactique' && (
          <AdOpsActionButtons
            rowType={row.type}
            data={row.data}
            selectedTactique={selectedTactiques.find(t => t.id === row.tactiqueId)}
            selectedCampaign={selectedCampaign}
            selectedVersion={selectedVersion}
            cm360History={cm360History}
            cm360Tags={cm360Tags}
          />
        )}
      </td>

      {/* Colonnes budgétaires conditionnelles */}
      {showBudgetParams && (
        <>
          <CM360Cell value={getFieldValue('budget')} fieldName="TC_Media_Budget" fieldLabel="Budget" cm360History={row.type === 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
          <CM360Cell value={getFieldValue('rate')} fieldName="TC_CM360_Rate" fieldLabel="Rate" cm360History={row.type === 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
          <CM360Cell value={getFieldValue('volume')} fieldName="TC_CM360_Volume" fieldLabel="Volume" cm360History={row.type === 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
          <CM360Cell value={getFieldValue('currency')} fieldName="TC_BuyCurrency" fieldLabel="Currency" cm360History={row.type === 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
          <CM360Cell value={getFieldValue('buyType')} fieldName="TC_Buy_Type" fieldLabel="Buy Type" cm360History={row.type === 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
        </>
      )}

      {/* Colonnes taxonomies conditionnelles */}
      {showTaxonomies && (
        <>
          <CM360Cell value={getFieldValue('tag1')} fieldName={row.type === 'placement' ? 'PL_Tag_1' : 'CR_Tag_5'} fieldLabel="Tag 1" cm360History={row.type !== 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
          <CM360Cell value={getFieldValue('tag2')} fieldName={row.type === 'placement' ? 'PL_Tag_2' : 'CR_Tag_6'} fieldLabel="Tag 2" cm360History={row.type !== 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
          <CM360Cell value={getFieldValue('tag3')} fieldName="PL_Tag_3" fieldLabel="Tag 3" cm360History={row.type === 'placement' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
        </>
      )}

      {/* Colonnes fixes */}
      <CM360Cell value={getFieldValue('tagType')} fieldName="PL_Tag_Type" fieldLabel="Tag Type" cm360History={row.type === 'placement' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
      <CM360Cell value={getFieldValue('startDate')} fieldName={row.type === 'placement' ? 'PL_Tag_Start_Date' : 'CR_Tag_Start_Date'} fieldLabel="Date début" cm360History={row.type !== 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
      <CM360Cell value={getFieldValue('endDate')} fieldName={row.type === 'placement' ? 'PL_Tag_End_Date' : 'CR_Tag_End_Date'} fieldLabel="Date fin" cm360History={row.type !== 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
      <CM360Cell value={getFieldValue('rotation')} fieldName={row.type === 'placement' ? 'PL_Rotation_Type' : 'CR_Rotation_Weight'} fieldLabel="Rotation" cm360History={row.type !== 'tactique' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
      <CM360Cell value={getFieldValue('floodlight')} fieldName="PL_Floodlight" fieldLabel="Floodlight" cm360History={row.type === 'placement' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
      <CM360Cell value={getFieldValue('thirdParty')} fieldName="PL_Third_Party_Measurement" fieldLabel="Third Party" cm360History={row.type === 'placement' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
      <CM360Cell value={getFieldValue('vpaid')} fieldName="PL_VPAID" fieldLabel="VPAID" cm360History={row.type === 'placement' ? cm360History : undefined} rowId={rowData.rowId} rowType={row.type} itemLabel={rowData.itemLabel} cm360Tags={cm360Tags} copiedField={copiedField} onCopyToClipboard={onCopyToClipboard} />
    </tr>
  );
}