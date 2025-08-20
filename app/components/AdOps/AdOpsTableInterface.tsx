// app/components/AdOps/AdOpsTableInterface.tsx
/**
 * Composant AdOpsTableInterface - Interface utilisateur pure
 * RESPONSABILITÉS : Rendu, filtres, tableau, interactions UI
 */
'use client';

import React from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import AdOpsTableRow from './AdOpsTableRow';
import { useTranslation } from '../../contexts/LanguageContext';

// Import des types unifiés
import {
  AdOpsTactique,
  AdOpsTableRow as TableRowType,
  CM360Status,
  CM360Filter,
  AdOpsFilterState,
  AdOpsSelectionState,
  AdOpsFormatters,
  ADOPS_COLORS
} from '../../types/adops';
import { CM360TagHistory } from '../../lib/cm360Service';

// ================================
// INTERFACE DU COMPOSANT
// ================================

interface AdOpsTableInterfaceProps {
  // Données
  selectedTactiques: AdOpsTactique[];
  selectedCampaign: any;
  selectedVersion: any;
  filteredRows: TableRowType[];
  cm360Tags?: Map<string, CM360TagHistory>;
  
  // États
  selectionState: AdOpsSelectionState;
  filterState: AdOpsFilterState;
  copiedField: string | null;
  cm360Loading: boolean;
  
  // Fonctions
  formatters: AdOpsFormatters;
  getFilteredCM360Tags: (tactiqueId: string) => Map<string, CM360TagHistory>;
  getRowCM360Status: (row: TableRowType) => CM360Status;
  selectedHasTags: () => boolean;
  
  // Gestionnaires
  handleRowSelection: (rowId: string, index: number, event: React.MouseEvent) => void;
  toggleExpanded: (rowId: string, rowType: string) => void;
  copyToClipboard: (value: any, fieldId: string) => void;
  createCM360Tags: () => Promise<void>;
  cancelCM360Tags: () => Promise<void>;
  applyColorToSelected: (color: string) => Promise<void>;
  updateFilterState: (updates: Partial<AdOpsFilterState>) => void;
  resetFilters: () => void;
  clearSelection: () => void;
  selectAllRows: () => void;
}

// ================================
// COMPOSANT INTERFACE PURE
// ================================

export default function AdOpsTableInterface({
  // Données
  selectedTactiques,
  selectedCampaign,
  selectedVersion,
  filteredRows,
  cm360Tags,
  
  // États
  selectionState,
  filterState,
  copiedField,
  cm360Loading,
  
  // Fonctions
  formatters,
  getFilteredCM360Tags,
  getRowCM360Status,
  selectedHasTags,
  
  // Gestionnaires
  handleRowSelection,
  toggleExpanded,
  copyToClipboard,
  createCM360Tags,
  cancelCM360Tags,
  applyColorToSelected,
  updateFilterState,
  resetFilters,
  clearSelection,
  selectAllRows
}: AdOpsTableInterfaceProps) {
  const { t } = useTranslation();

  // Vérification des données
  if (selectedTactiques.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <p className="text-sm">{t('adOps.interface.table.noTacticsSelected')}</p>
          <p className="text-xs mt-1">{t('adOps.interface.table.selectTacticsPrompt')}</p>
        </div>
      </div>
    );
  }

  const hasSelection = selectionState.selectedRows.size > 0;

  return (
    <div className="w-full h-full flex flex-col">
      
      {/* ================================ */}
      {/* EN-TÊTE AVEC CONTRÔLES */}
      {/* ================================ */}
      
      <div className="flex items-center justify-between mb-3 px-4 pt-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedTactiques.length} {selectedTactiques.length > 1 ? t('adOps.interface.table.tacticsSelected') : t('adOps.interface.table.tacticSelected')}
          </h3>
          
          {/* Boutons de filtrage par type */}
          <div className="flex items-center gap-1">
            {[
              { key: 'showTactiques', label: 'TAC', color: 'blue' },
              { key: 'showPlacements', label: 'PLA', color: 'green' },
              { key: 'showCreatives', label: 'CRE', color: 'purple' }
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => updateFilterState({ [key]: !filterState[key as keyof AdOpsFilterState] })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterState[key as keyof AdOpsFilterState]
                    ? `bg-${color}-100 text-${color}-700 border border-${color}-300`
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
            
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            
            {/* Toggles colonnes */}
            {[
              { key: 'showBudgetParams', label: t('adOps.interface.table.budgetInfo') },
              { key: 'showTaxonomies', label: t('adOps.interface.table.fullTaxonomies') }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => updateFilterState({ [key]: !filterState[key as keyof AdOpsFilterState] })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterState[key as keyof AdOpsFilterState]
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Actions sur sélection */}
        {hasSelection && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectionState.selectedRows.size} {t('adOps.interface.table.selected')}
            </span>
            
            {/* Boutons CM360 */}
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={createCM360Tags}
                disabled={cm360Loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckIcon className="w-4 h-4" />
                {cm360Loading ? t('adOps.interface.table.creating') : t('common.create')}
              </button>
              
              {selectedHasTags() && (
                <button
                  onClick={cancelCM360Tags}
                  disabled={cm360Loading}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  {cm360Loading ? t('adOps.interface.table.deleting') : t('common.delete')}
                </button>
              )}
            </div>
            
            {/* Sélecteur de couleurs */}
            <div className="flex items-center gap-1 ml-3">
              {ADOPS_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => applyColorToSelected(color.value)}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-all"
                  style={{ backgroundColor: color.value }}
                  title={`${t('adOps.interface.table.applyColor')} ${color.name}`}
                />
              ))}
              <button
                onClick={() => applyColorToSelected('')}
                className="w-6 h-6 rounded-full border-2 border-gray-400 bg-white hover:border-gray-600 transition-all relative"
                title={t('adOps.interface.table.removeColor')}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <XMarkIcon className="w-3 h-3 text-red-500" />
                </div>
              </button>
            </div>
            
            <button
              onClick={clearSelection}
              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 ml-3"
            >
              {t('adOps.interface.table.deselect')}
            </button>
          </div>
        )}
      </div>

      {/* ================================ */}
      {/* BARRE DE RECHERCHE ET FILTRES */}
      {/* ================================ */}
      
      <div className="mb-3 px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filterState.searchTerm}
              onChange={(e) => updateFilterState({ searchTerm: e.target.value })}
              placeholder={t('adOps.interface.table.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <button
            onClick={() => updateFilterState({ isFiltersVisible: !filterState.isFiltersVisible })}
            className={`p-2 border rounded-md transition-colors ${
              filterState.isFiltersVisible || filterState.cm360Filter !== 'all' || filterState.colorFilter !== 'all'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Panneau de filtres élégant */}
        {filterState.isFiltersVisible && (
          <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-6 flex-wrap">
              
              {/* Filtres CM360 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('adOps.interface.filters.cm360Status')}</span>
                <div className="flex items-center gap-1">
                  {[
                    { value: 'all' as CM360Filter, label: t('adOps.interface.filters.all'), color: 'gray' },
                    { value: 'created' as CM360Filter, label: t('adOps.interface.filters.tagsCreated'), color: 'green' },
                    { value: 'changed' as CM360Filter, label: t('adOps.interface.filters.toModify'), color: 'orange' },
                    { value: 'none' as CM360Filter, label: t('adOps.interface.filters.toCreate'), color: 'blue' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => updateFilterState({ cm360Filter: filter.value })}
                      className={`px-3 h-6 text-xs rounded-full border transition-colors ${
                        filterState.cm360Filter === filter.value
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Filtres par couleur */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{t('adOps.interface.filters.color')}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateFilterState({ colorFilter: 'all' })}
                    className={`px-3 h-6 text-xs rounded-full border transition-colors ${
                      filterState.colorFilter === 'all'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t('adOps.interface.filters.allColors')}
                  </button>
                  
                  <button
                    onClick={() => updateFilterState({ colorFilter: 'none' })}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center bg-white ${
                      filterState.colorFilter === 'none'
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title={t('adOps.interface.filters.filterNoColor')}
                  >
                    <XMarkIcon className="w-3 h-3 text-red-500" />
                  </button>
                  
                  {ADOPS_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => updateFilterState({ colorFilter: color.value })}
                      className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                        filterState.colorFilter === color.value
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={`${t('adOps.interface.filters.filterByColor')} ${color.name.toLowerCase()}`}
                    />
                  ))}
                </div>
              </div>
              
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                {t('adOps.interface.filters.reset')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================ */}
      {/* TABLEAU PRINCIPAL */}
      {/* ================================ */}
      
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg mx-4 mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="w-8 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={selectionState.selectedRows.size === filteredRows.length && filteredRows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllRows();
                    } else {
                      clearSelection();
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.name')}</th>
              <th className="w-80 px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.actions')}</th>
              
              {/* Colonnes budgétaires conditionnelles */}
              {filterState.showBudgetParams && (
                <>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.budget')}</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.rate')}</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.volume')}</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.currency')}</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.buyType')}</th>
                </>
              )}
              
              {/* Colonnes taxonomies conditionnelles */}
              {filterState.showTaxonomies && (
                <>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.campaignCreative')}</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.placementUrlUtm')}</th>
                  <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.ad')}</th>
                </>
              )}
              
              {/* Colonnes fixes */}
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.tagType')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.startDate')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.endDate')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.rotation')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.floodlight')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.thirdParty')}</th>
              <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('adOps.interface.table.header.vpaid')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td 
                  colSpan={
                    4 + 
                    (filterState.showBudgetParams ? 5 : 0) + 
                    (filterState.showTaxonomies ? 3 : 0) + 
                    7
                  } 
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {filterState.searchTerm ? 
                    `${t('adOps.interface.table.noResultsFor')} "${filterState.searchTerm}"` : 
                    t('adOps.interface.table.noDataWithFilters')
                  }
                </td>
              </tr>
            ) : (
              filteredRows.map((row, index) => {
                const rowId = `${row.type}-${row.data.id}`;
                const cm360Status = getRowCM360Status(row);
                const tactiqueId = row.type === 'tactique' ? row.data.id : row.tactiqueId!;
                const filteredTags = getFilteredCM360Tags(tactiqueId);
                const cm360History = row.type === 'tactique' 
                  ? filteredTags.get('metrics-tactics')
                  : filteredTags.get(rowId);
                
                return (
                  <AdOpsTableRow
                    key={rowId}
                    row={row}
                    index={index}
                    isSelected={selectionState.selectedRows.has(rowId)}
                    selectedTactiques={selectedTactiques}
                    selectedCampaign={selectedCampaign}
                    selectedVersion={selectedVersion}
                    cm360Status={cm360Status}
                    cm360History={cm360History}
                    cm360Tags={filteredTags}
                    showBudgetParams={filterState.showBudgetParams}
                    showTaxonomies={filterState.showTaxonomies}
                    copiedField={copiedField}
                    onRowSelection={handleRowSelection}
                    onToggleExpanded={toggleExpanded}
                    onCopyToClipboard={copyToClipboard}
                    formatCurrency={formatters.formatCurrency}
                    formatNumber={formatters.formatNumber}
                    formatDate={formatters.formatDate}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================================ */}
      {/* INFORMATIONS DE STATUT EN BAS */}
      {/* ================================ */}
      
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              {filteredRows.length} {t('adOps.interface.status.elementsDisplayed')}
              {filterState.searchTerm && ` (${t('adOps.interface.status.filteredBy')} "${filterState.searchTerm}")`}
            </span>
            
            {(filterState.cm360Filter !== 'all' || filterState.colorFilter !== 'all') && (
              <span className="text-indigo-600">
                {t('adOps.interface.status.activeFilters')}
              </span>
            )}
          </div>
          
          {hasSelection && (
            <span className="font-medium">
              {selectionState.selectedRows.size} {t('adOps.interface.table.selected')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}