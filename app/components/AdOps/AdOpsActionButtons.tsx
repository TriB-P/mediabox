// app/components/AdOps/AdOpsActionButtons.tsx
/**
 * Composant AdOpsActionButtons avec support CM360
 * Boutons d'actions spécialisés avec indicateurs de changements pour les tags
 * AMÉLIORÉ : Boutons forcés sur une seule ligne
 */
'use client';

import React, { useState } from 'react';
import { 
  ClipboardDocumentIcon, 
  CheckIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import CM360HistoryModal from './CM360HistoryModal';
import { CM360TagHistory, CM360TagData } from '../../lib/cm360Service';

interface AdOpsActionButtonsProps {
  rowType: 'placement' | 'creative';
  data: any;
  selectedTactique: any;
  selectedCampaign: any;
  selectedVersion: any;
  // Nouvelles props pour CM360
  cm360History?: CM360TagHistory;
  cm360Tags?: Map<string, CM360TagHistory>; // Nouveau prop
}

/**
 * Composant pour les boutons d'actions spécialisés avec support CM360
 */
export default function AdOpsActionButtons({
  rowType,
  data,
  selectedTactique,
  selectedCampaign,
  selectedVersion,
  cm360History,
  cm360Tags
}: AdOpsActionButtonsProps) {
  const [copiedButton, setCopiedButton] = useState<string | null>(null);
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
   * Vérifie si un champ a été modifié selon CM360
   */
  const isFieldChanged = (fieldName: string): boolean => {
    if (!cm360History?.changedFields) return false;
    return cm360History.changedFields.includes(fieldName);
  };

  /**
   * Ouvre le modal d'historique pour un champ spécifique
   */
  const openHistoryModal = (fieldName: string, fieldLabel: string, event: React.MouseEvent) => {
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

  /**
   * Copie une valeur avec feedback visuel
   */
  const copyTag = async (tagValue: string | undefined, buttonId: string) => {
    if (!tagValue) return;
    
    try {
      await navigator.clipboard.writeText(tagValue);
      setCopiedButton(buttonId);
      setTimeout(() => setCopiedButton(null), 1000);
    } catch (err) {
      console.error('Erreur copie tag:', err);
    }
  };

  /**
   * Composant bouton de copie réutilisable avec support CM360
   */
  const CopyButton = ({ 
    tagValue, 
    buttonId, 
    label,
    fieldName,
    variant = 'primary'
  }: { 
    tagValue: string | undefined; 
    buttonId: string; 
    label: string;
    fieldName: string;
    variant?: 'primary' | 'secondary';
  }) => {
    const isCopied = copiedButton === buttonId;
    const isDisabled = !tagValue;
    const isChanged = isFieldChanged(fieldName);
    
    const baseClasses = "px-2 py-1 text-xs rounded transition-all duration-200 flex items-center gap-1 font-medium relative flex-shrink-0";
    const variantClasses = variant === 'primary' 
      ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300";
    const disabledClasses = "opacity-50 cursor-not-allowed";
    const copiedClasses = "bg-green-100 text-green-700 border-green-300";
    const changedClasses = isChanged ? "ring-1 ring-red-300" : "";
    
    return (
      <div className="relative flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => copyTag(tagValue, buttonId)}
          disabled={isDisabled}
          className={`
            ${baseClasses}
            ${isCopied ? copiedClasses : variantClasses}
            ${isDisabled ? disabledClasses : ''}
            ${changedClasses}
          `}
          title={isDisabled ? 'Tag non disponible' : `Copier ${label.toLowerCase()}`}
        >
          {isCopied ? (
            <CheckIcon className="w-3 h-3" />
          ) : (
            <ClipboardDocumentIcon className="w-3 h-3" />
          )}
          <span className="whitespace-nowrap">{label}</span>
        </button>
        
        {/* Indicateur de changement CM360 */}
        {isChanged && !isDisabled && cm360History && (
          <button
            onClick={(e) => openHistoryModal(fieldName, label, e)}
            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50 -ml-1 flex-shrink-0"
            title={`${label} a été modifié depuis le dernier tag - Cliquer pour voir l'historique`}
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  /**
   * Obtient le label de l'item pour le modal
   */
  const getItemLabel = (): string => {
    if (rowType === 'placement') {
      return data.PL_Label || 'Placement sans nom';
    } else {
      return data.CR_Label || 'Créatif sans nom';
    }
  };

  if (rowType === 'placement') {
    return (
      <>
        {/* AMÉLIORÉ : Container avec nowrap et largeur minimale */}
        <div className="flex items-center gap-1 flex-nowrap min-w-fit">
          <CopyButton
            tagValue={data.PL_Tag_1}
            buttonId="pl-tag-1"
            label="Campagne"
            fieldName="PL_Tag_1"
            variant="primary"
          />
          <CopyButton
            tagValue={data.PL_Tag_2}
            buttonId="pl-tag-2"
            label="Placement"
            fieldName="PL_Tag_2"
            variant="primary"
          />
          <CopyButton
            tagValue={data.PL_Tag_3}
            buttonId="pl-tag-3"
            label="Ad"
            fieldName="PL_Tag_3"
            variant="primary"
          />
        </div>

        {/* Modal d'historique pour les tags de placement */}
        {modalState.isOpen && cm360History && (
          <CM360HistoryModal
            isOpen={modalState.isOpen}
            onClose={closeHistoryModal}
            fieldName={modalState.fieldName}
            fieldLabel={modalState.fieldLabel}
            currentValue={data[modalState.fieldName]}
            tags={cm360History.tags}
            itemType="placement"
            itemLabel={getItemLabel()}
            cm360Tags={cm360Tags}
          />
        )}
      </>
    );
  }

  if (rowType === 'creative') {
    return (
      <>
        {/* AMÉLIORÉ : Container avec nowrap et largeur minimale */}
        <div className="flex items-center gap-1 flex-nowrap min-w-fit">
          <CopyButton
            tagValue={data.CR_Tag_5}
            buttonId="cr-tag-5"
            label="Créatif"
            fieldName="CR_Tag_5"
            variant="secondary"
          />
          <CopyButton
            tagValue={data.CR_Tag_6}
            buttonId="cr-tag-6"
            label="URL"
            fieldName="CR_Tag_6"
            variant="secondary"
          />
        </div>

        {/* Modal d'historique pour les tags de créatif */}
        {modalState.isOpen && cm360History && (
          <CM360HistoryModal
            isOpen={modalState.isOpen}
            onClose={closeHistoryModal}
            fieldName={modalState.fieldName}
            fieldLabel={modalState.fieldLabel}
            currentValue={data[modalState.fieldName]}
            tags={cm360History.tags}
            itemType="creative"
            itemLabel={getItemLabel()}
            cm360Tags={cm360Tags}
          />
        )}
      </>
    );
  }

  return <div className="text-gray-400 text-xs">-</div>;
}