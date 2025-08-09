// app/components/AdOps/AdOpsTableRow.tsx
/**
 * Composant AdOpsTableRow
 * Gère l'affichage d'une ligne du tableau (placement ou créatif).
 * Inclut la copie de valeurs, l'expansion et la coloration.
 */
'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import AdOpsActionButtons from './AdOpsActionButtons';

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
  selectedRows: Set<string>; // Ajout pour vérifier les créatifs sélectionnés
}

/**
 * Composant pour une ligne du tableau AdOps
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
  selectedRows
}: AdOpsTableRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
   * Composant pour une cellule copiable
   */
  const CopyableCell = ({ 
    value, 
    fieldName, 
    className = '' 
  }: { 
    value: any; 
    fieldName: string; 
    className?: string; 
  }) => {
    const isCopied = copiedField === fieldName;
    const displayValue = value === undefined || value === null ? '-' : String(value);
    
    return (
      <td 
        className={`px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-50 relative ${className}`}
        onClick={() => copyToClipboard(value, fieldName)}
        title="Cliquer pour copier"
      >
        <div className="flex items-center">
          <span className={value === undefined || value === null ? 'text-gray-400' : 'text-gray-900'}>
            {displayValue}
          </span>
          {isCopied && (
            <CheckIcon className="w-4 h-4 text-green-600 ml-2 animate-pulse" />
          )}
        </div>
      </td>
    );
  };

  /**
   * Formatte les valeurs booléennes
   */
  const formatBoolean = (value: boolean | undefined): string => {
    if (value === undefined || value === null) return '-';
    return value ? 'Oui' : 'Non';
  };

  /**
   * Formatte les dates
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-CA');
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
    <tr 
      className={`
        ${isSelected ? 'ring-2 ring-indigo-500 ring-opacity-75' : (!customColor ? 'hover:bg-gray-50' : '')}
        ${isCreative ? 'border-l-4 border-l-gray-300' : ''}
        transition-colors duration-150
      `}
      style={backgroundStyle} // Toujours appliquer la couleur de fond si elle existe
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
            onChange={() => {}} // Vide pour éviter les warnings
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
          />
        </div>
      </td>

      {/* Label avec indentation et expansion */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          
          {isPlacement && hasChildren && (
            <span className={`mr-2 text-xs px-2 py-1 rounded-full ${
              hasSelectedChildren() 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {row.children?.length} créatif{(row.children?.length || 0) > 1 ? 's' : ''}
              {hasSelectedChildren() && ' ★'}
            </span>
          )}
          
          <div
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
            onClick={() => copyToClipboard(
              isPlacement ? row.data.PL_Label : row.data.CR_Label, 
              'label'
            )}
            title="Cliquer pour copier"
          >
            <span className={`${isCreative ? 'text-gray-600 text-sm' : 'text-gray-900'}`}>
              {isPlacement ? (row.data.PL_Label || 'Placement sans nom') : (row.data.CR_Label || 'Créatif sans nom')}
            </span>
            {copiedField === 'label' && (
              <CheckIcon className="w-4 h-4 text-green-600 ml-2 inline animate-pulse" />
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
        />
      </td>

      {/* Tag Type */}
      <CopyableCell 
        value={isPlacement ? row.data.PL_Tag_Type : '-'} 
        fieldName="tagType" 
      />

      {/* Date Début */}
      <CopyableCell 
        value={formatDate(isPlacement ? row.data.PL_Tag_Start_Date : row.data.CR_Tag_Start_Date)} 
        fieldName="startDate" 
      />

      {/* Date Fin */}
      <CopyableCell 
        value={formatDate(isPlacement ? row.data.PL_Tag_End_Date : row.data.CR_Tag_End_Date)} 
        fieldName="endDate" 
      />

      {/* Rotation Type / Weight */}
      <CopyableCell 
        value={isPlacement ? row.data.PL_Rotation_Type : row.data.CR_Rotation_Weight} 
        fieldName="rotation" 
      />

      {/* Floodlight (seulement pour placements) */}
      <CopyableCell 
        value={isPlacement ? row.data.PL_Floodlight : '-'} 
        fieldName="floodlight" 
      />

      {/* Third Party Measurement */}
      <CopyableCell 
        value={formatBoolean(isPlacement ? row.data.PL_Third_Party_Measurement : undefined)} 
        fieldName="thirdParty" 
      />

      {/* VPAID */}
      <CopyableCell 
        value={formatBoolean(isPlacement ? row.data.PL_VPAID : undefined)} 
        fieldName="vpaid" 
      />
    </tr>
  );
}