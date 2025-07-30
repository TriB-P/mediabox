// app/components/Tactiques/Views/Timeline/TactiquesTimelineView.tsx
/**
 * Vue timeline rénovée pour visualiser et éditer les répartitions des tactiques selon les breakdowns.
 * Permet de changer de breakdown, voir les périodes correspondantes et éditer les valeurs directement.
 * Inclut les fonctionnalités d'édition en ligne avec copier-coller et gestion des périodes actives.
 * CORRIGÉ: Consolidation des boutons d'édition
 * FINAL: Corrections finales
 * NOUVEAU: Support du type PEBs avec icône calculatrice
 * CORRIGÉ: Contraintes de largeur pour éviter le double scroll horizontal
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tactique } from '../../../../types/tactiques';
import { Breakdown } from '../../../../types/breakdown';
import TactiquesTimelineTable from './TactiquesTimelineTable';
import { 
  CalendarIcon, 
  ClockIcon, 
  Cog6ToothIcon,
  CalculatorIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface TactiquesTimelineViewProps {
  tactiques: Tactique[];
  sectionNames: { [key: string]: string };
  campaignStartDate: string;
  campaignEndDate: string;
  formatCurrency: (amount: number) => string;
  onEditTactique: (tactiqueId: string, sectionId: string) => void;
  // Nouvelles props pour les breakdowns
  breakdowns: Breakdown[];
  onUpdateTactique: (
    sectionId: string,
    tactiqueId: string, 
    updates: Partial<Tactique>
  ) => Promise<void>;
}

/**
 * Composant principal de la vue timeline rénovée.
 * Gère la sélection des breakdowns et orchestre l'affichage du tableau.
 */
export default function TactiquesTimelineView({
  tactiques,
  sectionNames,
  campaignStartDate,
  campaignEndDate,
  formatCurrency,
  onEditTactique,
  breakdowns,
  onUpdateTactique
}: TactiquesTimelineViewProps) {
  const [selectedBreakdownId, setSelectedBreakdownId] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialisation du breakdown par défaut
  useEffect(() => {
    if (breakdowns && Array.isArray(breakdowns) && breakdowns.length > 0 && !selectedBreakdownId) {
      const defaultBreakdown = breakdowns.find(b => b.isDefault) || breakdowns[0];
      setSelectedBreakdownId(defaultBreakdown.id);
    }
  }, [breakdowns, selectedBreakdownId]);

  const selectedBreakdown = useMemo(() => {
    if (!breakdowns || !Array.isArray(breakdowns)) {
      return null;
    }
    return breakdowns.find(b => b.id === selectedBreakdownId) || null;
  }, [breakdowns, selectedBreakdownId]);

  /**
   * Obtient l'icône correspondante à un type de breakdown.
   * NOUVEAU: Support de l'icône CalculatorIcon pour PEBs
   */
  const getBreakdownIcon = (type: string) => {
    switch (type) {
      case 'Hebdomadaire':
        return CalendarIcon;
      case 'Mensuel':
        return ClockIcon;
      case 'PEBs':
        return CalculatorIcon; // NOUVEAU: Icône pour PEBs
      case 'Custom':
        return Cog6ToothIcon;
      default:
        return CalendarIcon;
    }
  };

  /**
   * Groupe les tactiques par section pour l'affichage hiérarchique.
   */
  const tactiquesGroupedBySection = useMemo(() => {
    const grouped: { [sectionId: string]: Tactique[] } = {};
    
    tactiques.forEach(tactique => {
      const sectionId = tactique.TC_SectionId;
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(tactique);
    });

    // Trier les tactiques dans chaque section par ordre
    Object.keys(grouped).forEach(sectionId => {
      grouped[sectionId].sort((a, b) => (a.TC_Order || 0) - (b.TC_Order || 0));
    });

    return grouped;
  }, [tactiques]);

  /**
   * Gère le changement de breakdown sélectionné.
   */
  const handleBreakdownChange = (breakdownId: string) => {
    if (editMode) {
      const confirmChange = confirm(
        'Vous êtes en mode édition. Changer de breakdown annulera vos modifications. Continuer ?'
      );
      if (!confirmChange) return;
    }
    
    setEditMode(false);
    setSelectedBreakdownId(breakdownId);
  };

  /**
   * Active le mode édition.
   */
  const handleStartEdit = () => {
    setEditMode(true);
  };

  /**
   * NOUVEAU: Gère la sauvegarde complète après édition.
   */
  const handleSaveComplete = () => {
    setEditMode(false);
    // Ici on pourrait ajouter une notification de succès
    console.log('✅ Sauvegarde des répartitions terminée');
  };

  /**
   * NOUVEAU: Gère l'annulation de l'édition (appelé depuis le tableau).
   */
  const handleCancelEdit = () => {
    setEditMode(false);
  };

  /**
   * Exporte les données au format CSV.
   */
  const handleExportCSV = () => {
    if (!selectedBreakdown) return;

    // Ici on pourrait implémenter l'export CSV
    // Pour l'instant, on affiche juste un message
    console.log('Export CSV pour le breakdown:', selectedBreakdown.name);
  };

  // Vérification de sécurité supplémentaire
  if (!breakdowns || !Array.isArray(breakdowns) || breakdowns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">
          Aucun breakdown configuré pour cette campagne. 
          Veuillez configurer des breakdowns dans les paramètres de campagne.
        </p>
      </div>
    );
  }

  if (tactiques.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">
          Aucune tactique disponible pour cette campagne.
        </p>
      </div>
    );
  }

  return (
    <div 
  className="space-y-4 w-full max-w-full overflow-hidden"
  style={{ width: '100%', maxWidth: '70vw' }}
>
              
      {/* Header avec contrôles */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Sélecteur de breakdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Répartition :
              </label>
              <select
                value={selectedBreakdownId}
                onChange={(e) => handleBreakdownChange(e.target.value)}
                disabled={editMode && loading}
                className="pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {breakdowns && Array.isArray(breakdowns) && breakdowns.map((breakdown) => {
                  const Icon = getBreakdownIcon(breakdown.type);
                  return (
                    <option key={breakdown.id} value={breakdown.id}>
                      {breakdown.name} ({breakdown.type})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Informations sur le breakdown sélectionné */}
            {selectedBreakdown && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  {React.createElement(getBreakdownIcon(selectedBreakdown.type), {
                    className: "h-4 w-4"
                  })}
                  <span>{selectedBreakdown.type}</span>
                  {/* NOUVEAU: Indication spéciale pour PEBs */}
                  {selectedBreakdown.type === 'PEBs' && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium ml-2">
                      3 valeurs
                    </span>
                  )}
                </div>
                {selectedBreakdown.type !== 'Custom' && (
                  <span>
                    • {selectedBreakdown.startDate} → {selectedBreakdown.endDate}
                  </span>
                )}
                {selectedBreakdown.type === 'Custom' && selectedBreakdown.customPeriods && (
                  <span>
                    • {selectedBreakdown.customPeriods.length} période(s)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* CORRIGÉ: Bouton mode édition seulement si pas en mode édition */}
            {!editMode && (
              <button
                onClick={handleStartEdit}
                className="flex items-center px-4 py-2 text-sm rounded-md font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                disabled={loading}
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Mode édition
              </button>
            )}
          </div>
        </div>

        {/* Message d'information en mode édition */}
        {editMode && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 mt-0.5">
                <CheckIcon className="h-4 w-4" />
              </div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Mode édition activé</p>
                <p className="mt-1">
                  Vous pouvez maintenant modifier les valeurs des répartitions. 
                  Utilisez Ctrl+C/⌘+C pour copier et Ctrl+V/⌘+V pour coller.
                  {selectedBreakdown?.isDefault && " Cochez/décochez les cases pour activer/désactiver les périodes."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau des répartitions avec scroll horizontal contraint */}
      {selectedBreakdown ? (
        <div className="bg-white rounded-lg shadow w-full overflow-hidden">
          <TactiquesTimelineTable
            tactiques={Object.values(tactiquesGroupedBySection).flat()}
            sectionNames={sectionNames}
            selectedBreakdown={selectedBreakdown}
            editMode={editMode}
            campaignStartDate={campaignStartDate}
            campaignEndDate={campaignEndDate}
            formatCurrency={formatCurrency}
            onUpdateTactique={onUpdateTactique}
            onSaveComplete={handleSaveComplete}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">
            Aucun breakdown sélectionné. Veuillez sélectionner un breakdown pour voir les répartitions.
          </p>
        </div>
      )}

    </div>
  );
}