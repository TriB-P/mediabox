// app/components/Campaigns/CampaignActions.tsx

'use client';

import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon 
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { deleteCampaign, duplicateCampaign } from '../../lib/campaignService';
import { useAuth } from '../../contexts/AuthContext';

interface CampaignActionsProps {
  campaign: Campaign;
  clientId: string;
  onEdit: (campaign: Campaign) => void;
  onRefresh: () => void;
  className?: string;
}

export default function CampaignActions({
  campaign,
  clientId,
  onEdit,
  onRefresh,
  className = ''
}: CampaignActionsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    onEdit(campaign);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    // 🔥 CORRECTION: Utiliser CA_Name au lieu de name
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la campagne "${campaign.CA_Name}" ?\n\nCette action est irréversible et supprimera également toutes les tactiques, versions et autres données associées.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteCampaign(clientId, campaign.id);
      onRefresh();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la campagne. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleDuplicate = async () => {
    if (!user?.email) {
      alert('Utilisateur non connecté.');
      return;
    }

    // 🔥 CORRECTION: Utiliser CA_Name au lieu de name
    const newName = `${campaign.CA_Name} - Copie`;

    try {
      setIsLoading(true);
      await duplicateCampaign(clientId, campaign.id, user.email, newName);
      onRefresh();
      alert('Campagne dupliquée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      alert('Erreur lors de la duplication de la campagne. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  // Fermer le menu si on clique à l'extérieur
  React.useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className={`relative ${className}`}>
      {/* Version mobile/compacte avec menu déroulant */}
      <div className="sm:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-10 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[150px]">
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <PencilIcon className="h-4 w-4" />
              Modifier
            </button>
            <button
              onClick={handleDuplicate}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              Dupliquer
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Version desktop avec boutons séparés */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
          title="Modifier la campagne"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleDuplicate}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
          title="Dupliquer la campagne"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
          title="Supprimer la campagne"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
}