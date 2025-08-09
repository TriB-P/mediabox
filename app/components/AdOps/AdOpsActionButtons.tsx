// app/components/AdOps/AdOpsActionButtons.tsx
/**
 * Composant AdOpsActionButtons
 * Boutons d'actions spécialisés pour copier les tags des placements et créatifs.
 * Tooltips informatifs pour chaque bouton.
 */
'use client';

import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface AdOpsActionButtonsProps {
  rowType: 'placement' | 'creative';
  data: any;
  selectedTactique: any;
  selectedCampaign: any;
  selectedVersion: any;
}

/**
 * Composant pour les boutons d'actions spécialisés
 */
export default function AdOpsActionButtons({
  rowType,
  data,
  selectedTactique,
  selectedCampaign,
  selectedVersion
}: AdOpsActionButtonsProps) {
  const [copiedButton, setCopiedButton] = useState<string | null>(null);

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
   * Composant bouton de copie réutilisable
   */
  const CopyButton = ({ 
    tagValue, 
    buttonId, 
    label,
    variant = 'primary'
  }: { 
    tagValue: string | undefined; 
    buttonId: string; 
    label: string;
    variant?: 'primary' | 'secondary';
  }) => {
    const isCopied = copiedButton === buttonId;
    const isDisabled = !tagValue;
    
    const baseClasses = "px-2 py-1 text-xs rounded transition-all duration-200 flex items-center gap-1 font-medium";
    const variantClasses = variant === 'primary' 
      ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300";
    const disabledClasses = "opacity-50 cursor-not-allowed";
    const copiedClasses = "bg-green-100 text-green-700 border-green-300";
    
    return (
      <button
        onClick={() => copyTag(tagValue, buttonId)}
        disabled={isDisabled}
        className={`
          ${baseClasses}
          ${isCopied ? copiedClasses : variantClasses}
          ${isDisabled ? disabledClasses : ''}
        `}
        title={isDisabled ? 'Tag non disponible' : `Copier ${label.toLowerCase()}`}
      >
        {isCopied ? (
          <CheckIcon className="w-3 h-3" />
        ) : (
          <ClipboardDocumentIcon className="w-3 h-3" />
        )}
        <span>{label}</span>
      </button>
    );
  };

  if (rowType === 'placement') {
    return (
      <div className="flex items-center gap-1">
        <CopyButton
          tagValue={data.PL_Tag_1}
          buttonId="pl-tag-1"
          label="Campagne"
          variant="primary"
        />
        <CopyButton
          tagValue={data.PL_Tag_2}
          buttonId="pl-tag-2"
          label="Placement"
          variant="primary"
        />
        <CopyButton
          tagValue={data.PL_Tag_3}
          buttonId="pl-tag-3"
          label="Ad"
          variant="primary"
        />
      </div>
    );
  }

  if (rowType === 'creative') {
    return (
      <div className="flex items-center gap-1">
        <CopyButton
          tagValue={data.CR_Tag_5}
          buttonId="cr-tag-5"
          label="Créatif"
          variant="secondary"
        />
        <CopyButton
          tagValue={data.CR_Tag_6}
          buttonId="cr-tag-6"
          label="URL"
          variant="secondary"
        />
      </div>
    );
  }

  return <div className="text-gray-400 text-xs">-</div>;
}