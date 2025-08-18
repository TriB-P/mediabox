// app/components/AdOps/AdOpsTableRow.tsx
/**
 * Composant ligne du tableau AdOps avec badges, indicateurs CM360 cliquables et support couleurs
 * SÉPARÉ du tableau principal pour réduire la complexité
 * CORRIGÉ : Indicateurs de changement cliquables + meilleure gestion couleurs
 */
'use client';

import React, { useState } from 'react';
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

// Interfaces
interface AdOpsTactique {
  id: string;
  TC_Label?: string;
  TC_Media_Budget?: number;
  TC_BuyCurrency?: string;
  TC_CM360_Rate?: number;
  TC_CM360_Volume?: number;
  TC_Buy_Type?: string;
  TC_Publisher?: string;
  ongletName: string;
  sectionName: string;
  ongletId: string;
  sectionId: string;
  placementsWithTags: any[];
}

interface Placement {
  id: string;
  PL_Label?: string;
  PL_Tag_Type?: string;
  PL_Tag_Start_Date?: string;
  PL_Tag_End_Date?: string;
  PL_Rotation_Type?: string;
  PL_Floodlight?: string;
  PL_Third_Party_Measurement?: boolean;
  PL_VPAID?: boolean;
  PL_Tag_1?: string;
  PL_Tag_2?: string;
  PL_Tag_3?: string;
  PL_Adops_Color?: string;
  PL_Order?: number;
}

interface Creative {
  id: string;
  CR_Label?: string;
  CR_Tag_Start_Date?: string;
  CR_Tag_End_Date?: string;
  CR_Rotation_Weight?: number;
  CR_Tag_5?: string;
  CR_Tag_6?: string;
  CR_Adops_Color?: string;
  CR_Order?: number;
}

interface TableRow {
  type: 'tactique' | 'placement' | 'creative';
  level: 0 | 1 | 2;
  data: AdOpsTactique | Placement | Creative;
  tactiqueId?: string;
  placementId?: string;
  isExpanded?: boolean;
  children?: TableRow[];
}

interface AdOpsTableRowProps {
  row: TableRow;
  index: number;
  isSelected: boolean;
  selectedTactiques: AdOpsTactique[];
  selectedCampaign: any;
  selectedVersion: any;
  cm360Status: 'none' | 'created' | 'changed' | 'partial';
  cm360History?: CM360TagHistory;
  cm360Tags?: Map<string, CM360TagHistory>;
  showBudgetParams: boolean;
  showTaxonomies: boolean;
  copiedField: string | null;
  onRowSelection: (rowId: string, index: number, event: React.MouseEvent) => void;
  onToggleExpanded: (rowId: string, rowType: string) => void;
  onCopyToClipboard: (value: any, fieldId: string) => void;
  formatCurrency: (amount: number | undefined, currency: string | undefined) => string;
  formatNumber: (num: number | undefined) => string;
  formatDate: (dateString: string | undefined) => string;
}

/**
 * Composant badge pour les types de lignes
 */
const TypeBadge = ({ type }: { type: 'tactique' | 'placement' | 'creative' }) => {
  const badgeConfig = {
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
  };

  const config = badgeConfig[type];
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

/**
 * Composant cellule avec indicateurs de changement CM360 cliquables
 */
const CM360Cell = ({ 
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
}: { 
  value: any; 
  fieldName: string; 
  fieldLabel: string;
  cm360History?: CM360TagHistory;
  rowId: string;
  rowType: 'tactique' | 'placement' | 'creative';
  itemLabel: string;
  cm360Tags?: Map<string, CM360TagHistory>;
  copiedField: string | null;
  onCopyToClipboard: (value: any, fieldId: string) => void;
  className?: string; 
}) => {
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

  const isChanged = cm360History?.changedFields?.includes(fieldName) || false;
  const displayValue = value === undefined || value === null ? '-' : String(value);
  const isEmpty = value === undefined || value === null;
  const cellId = `${rowId}-${fieldName}`;

  /**
   * Ouvre le modal d'historique pour un champ spécifique
   */
  const openHistoryModal = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
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

  return (
    <>
      <td className={`px-6 py-4 whitespace-nowrap text-sm relative ${className}`}>
        <div className="flex items-center gap-1">
          <span 
            className={`cursor-pointer hover:bg-gray-100 px-1 py-1 rounded transition-colors ${
              isEmpty ? 'text-gray-400' : 'text-gray-900'
            } ${isChanged ? 'bg-red-50 text-red-900 ring-1 ring-red-200' : ''}`}
            onClick={() => onCopyToClipboard(value, cellId)}
            title={isChanged ? `${fieldLabel} modifié depuis dernier tag CM360` : t('tableRow.clickToCopy')}
          >
            {displayValue}
          </span>
          
          {copiedField === cellId && (
            <CheckIcon className="w-4 h-4 text-green-600 animate-pulse" />
          )}
          
          {/* NOUVEAU : Indicateur de changement CM360 CLIQUABLE */}
          {isChanged && cm360History && (
            <button
              onClick={openHistoryModal}
              className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
              title={`${fieldLabel} a changé - Cliquer pour voir l'historique`}
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>

      {/* Modal d'historique CM360 */}
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
};

/**
 * Composant principal de ligne du tableau
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
  const rowId = `${row.type}-${row.data.id}`;
  const hasChildren = row.children && row.children.length > 0;

  // CORRIGÉ : Couleur de fond et style de ligne selon le type
  const getRowStyles = (): { className: string; style: React.CSSProperties } => {
    let className = 'transition-colors ';
    let style: React.CSSProperties = {};
    
    // Couleur utilisateur (prioritaire) - SUPPORT TACTIQUES AJOUTÉ
    const userColor = row.type === 'tactique'
      ? (row.data as any).TC_Adops_Color // NOUVEAU : Support couleur tactiques
      : row.type === 'placement' 
      ? (row.data as Placement).PL_Adops_Color 
      : (row.data as Creative).CR_Adops_Color;
    
    if (userColor) {
      style.backgroundColor = userColor;
      // Garder un contraste minimal pour la lisibilité
      className += 'text-gray-900 ';
    } else {
      // Styles par défaut selon le type (si pas de couleur utilisateur)
      if (row.type === 'tactique') {
        className += 'bg-slate-50 border-b-2 border-slate-200 ';
      } else if (row.type === 'placement') {
        className += 'bg-white border-l-4 border-l-indigo-200 ';
      } else {
        className += 'bg-gray-50 border-l-4 border-l-gray-300 ';
      }
    }
    
    // État de sélection
    if (isSelected) {
      className += 'ring-2 ring-indigo-500 bg-indigo-50 ';
    } else {
      className += 'hover:bg-gray-50 ';
    }
    
    return { className, style };
  };

  const rowStyles = getRowStyles();
  const itemLabel = row.type === 'tactique' 
    ? (row.data as AdOpsTactique).TC_Label || 'Tactique sans nom'
    : row.type === 'placement'
    ? (row.data as Placement).PL_Label || 'Placement sans nom'
    : (row.data as Creative).CR_Label || 'Créatif sans nom';

  return (
    <tr className={rowStyles.className} style={rowStyles.style}>
      {/* Checkbox */}
      <td className="w-8 px-2 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onRowSelection(rowId, index, e)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>

      {/* Statut CM360 */}
      <td className="w-6 px-2 py-4">
        <div className="flex items-center justify-center">
          {cm360Status === 'created' && (
            <CheckCircleIcon className="w-6 h-6 text-green-600" title="Tags créés" />
          )}
          {(cm360Status === 'changed' || cm360Status === 'partial') && (
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" title="Changements détectés" />
          )}
        </div>
      </td>

      {/* Label avec indentation et badges de type */}
      <td className="py-4 whitespace-nowrap text-sm">
        <div className={`flex items-center gap-3 ${
          row.level === 1 ? 'ml-6' : row.level === 2 ? 'ml-12' : ''
        }`}>
          {hasChildren && (
            <button
              onClick={() => onToggleExpanded(rowId, row.type)}
              className="mr-2 p-1 rounded hover:bg-gray-200"
            >
              {row.isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Badge de type */}
          <TypeBadge type={row.type} />
          
          {/* Label avec indicateur de changement cliquable */}
          <div className="flex items-center gap-1">
            <span 
              className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                row.type === 'tactique' ? 'font-bold text-gray-900' :
                row.type === 'placement' ? 'font-medium text-gray-800' :
                'font-normal text-gray-600'
              }`}
              onClick={() => onCopyToClipboard(itemLabel, `${rowId}-label`)}
            >
              {itemLabel}
            </span>
            
            {copiedField === `${rowId}-label` && (
              <CheckIcon className="w-4 h-4 text-green-600 animate-pulse" />
            )}
            
            {/* Indicateur de changement pour le label CLIQUABLE */}
            {cm360History?.changedFields?.includes(
              row.type === 'tactique' ? 'TC_Label' : 
              row.type === 'placement' ? 'PL_Label' : 'CR_Label'
            ) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Ouvrir modal pour le label
                }}
                className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                title="Label modifié - Cliquer pour voir l'historique"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="w-80 px-6 py-4">
        {row.type !== 'tactique' && (
          <AdOpsActionButtons
            rowType={row.type as 'placement' | 'creative'}
            data={row.data}
            selectedTactique={selectedTactiques.find(t => t.id === row.tactiqueId)}
            selectedCampaign={selectedCampaign}
            selectedVersion={selectedVersion}
            cm360History={cm360History}
            cm360Tags={cm360Tags}
          />
        )}
      </td>

      {/* CONDITIONNEL : Colonnes budgétaires avec indicateurs de changement cliquables */}
      {showBudgetParams && (
        <>
          {/* Budget */}
          <CM360Cell 
            value={row.type === 'tactique' ? formatCurrency((row.data as AdOpsTactique).TC_Media_Budget, (row.data as AdOpsTactique).TC_BuyCurrency) : '-'}
            fieldName="TC_Media_Budget"
            fieldLabel="Budget"
            cm360History={row.type === 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />

          {/* Rate */}
          <CM360Cell 
            value={row.type === 'tactique' ? formatCurrency((row.data as AdOpsTactique).TC_CM360_Rate, (row.data as AdOpsTactique).TC_BuyCurrency) : '-'}
            fieldName="TC_CM360_Rate"
            fieldLabel="Rate"
            cm360History={row.type === 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />

          {/* Volume */}
          <CM360Cell 
            value={row.type === 'tactique' ? formatNumber((row.data as AdOpsTactique).TC_CM360_Volume) : '-'}
            fieldName="TC_CM360_Volume"
            fieldLabel="Volume"
            cm360History={row.type === 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />

          {/* Currency */}
          <CM360Cell 
            value={row.type === 'tactique' ? (row.data as AdOpsTactique).TC_BuyCurrency || 'N/A' : '-'}
            fieldName="TC_BuyCurrency"
            fieldLabel="Currency"
            cm360History={row.type === 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />

          {/* Buy Type */}
          <CM360Cell 
            value={row.type === 'tactique' ? (row.data as AdOpsTactique).TC_Buy_Type || 'N/A' : '-'}
            fieldName="TC_Buy_Type"
            fieldLabel="Buy Type"
            cm360History={row.type === 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />
        </>
      )}

      {/* CONDITIONNEL : Colonnes taxonomies avec indicateurs de changement cliquables */}
      {showTaxonomies && (
        <>
          {/* Tag 1 */}
          <CM360Cell 
            value={row.type === 'placement' ? (row.data as Placement).PL_Tag_1 : 
                   row.type === 'creative' ? (row.data as Creative).CR_Tag_5 : '-'}
            fieldName={row.type === 'placement' ? 'PL_Tag_1' : 'CR_Tag_5'}
            fieldLabel="Tag 1"
            cm360History={row.type !== 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />

          {/* Tag 2 */}
          <CM360Cell 
            value={row.type === 'placement' ? (row.data as Placement).PL_Tag_2 : 
                   row.type === 'creative' ? (row.data as Creative).CR_Tag_6 : '-'}
            fieldName={row.type === 'placement' ? 'PL_Tag_2' : 'CR_Tag_6'}
            fieldLabel="Tag 2"
            cm360History={row.type !== 'tactique' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />

          {/* Tag 3 */}
          <CM360Cell 
            value={row.type === 'placement' ? (row.data as Placement).PL_Tag_3 : '-'}
            fieldName="PL_Tag_3"
            fieldLabel="Tag 3"
            cm360History={row.type === 'placement' ? cm360History : undefined}
            rowId={rowId}
            rowType={row.type}
            itemLabel={itemLabel}
            cm360Tags={cm360Tags}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />
        </>
      )}

      {/* Colonnes fixes avec indicateurs de changement cliquables */}
      <CM360Cell 
        value={row.type === 'placement' ? (row.data as Placement).PL_Tag_Type || '-' : '-'}
        fieldName="PL_Tag_Type"
        fieldLabel="Tag Type"
        cm360History={row.type === 'placement' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
      
      <CM360Cell 
        value={row.type === 'placement' ? formatDate((row.data as Placement).PL_Tag_Start_Date) : 
               row.type === 'creative' ? formatDate((row.data as Creative).CR_Tag_Start_Date) : '-'}
        fieldName={row.type === 'placement' ? 'PL_Tag_Start_Date' : 'CR_Tag_Start_Date'}
        fieldLabel="Date début"
        cm360History={row.type !== 'tactique' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
      
      <CM360Cell 
        value={row.type === 'placement' ? formatDate((row.data as Placement).PL_Tag_End_Date) : 
               row.type === 'creative' ? formatDate((row.data as Creative).CR_Tag_End_Date) : '-'}
        fieldName={row.type === 'placement' ? 'PL_Tag_End_Date' : 'CR_Tag_End_Date'}
        fieldLabel="Date fin"
        cm360History={row.type !== 'tactique' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
      
      <CM360Cell 
        value={row.type === 'placement' ? (row.data as Placement).PL_Rotation_Type : 
               row.type === 'creative' ? (row.data as Creative).CR_Rotation_Weight : '-'}
        fieldName={row.type === 'placement' ? 'PL_Rotation_Type' : 'CR_Rotation_Weight'}
        fieldLabel="Rotation"
        cm360History={row.type !== 'tactique' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
      
      <CM360Cell 
        value={row.type === 'placement' ? (row.data as Placement).PL_Floodlight || '-' : '-'}
        fieldName="PL_Floodlight"
        fieldLabel="Floodlight"
        cm360History={row.type === 'placement' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
      
      <CM360Cell 
        value={row.type === 'placement' ? 
                ((row.data as Placement).PL_Third_Party_Measurement ? t('common.yes') : t('common.no')) : '-'}
        fieldName="PL_Third_Party_Measurement"
        fieldLabel="Third Party"
        cm360History={row.type === 'placement' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
      
      <CM360Cell 
        value={row.type === 'placement' ? 
                ((row.data as Placement).PL_VPAID ? t('common.yes') : t('common.no')) : '-'}
        fieldName="PL_VPAID"
        fieldLabel="VPAID"
        cm360History={row.type === 'placement' ? cm360History : undefined}
        rowId={rowId}
        rowType={row.type}
        itemLabel={itemLabel}
        cm360Tags={cm360Tags}
        copiedField={copiedField}
        onCopyToClipboard={onCopyToClipboard}
      />
    </tr>
  );
}