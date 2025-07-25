/**
 * Ce fichier définit le composant `CampaignActions`, qui fournit une série de boutons d'action
 * (Modifier, Dupliquer, Supprimer) pour une campagne spécifique. Le composant gère son propre état
 * de chargement et s'adapte à l'affichage sur mobile (menu déroulant) et sur ordinateur (boutons directs).
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon 
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { deleteCampaign, duplicateCampaign } from '../../lib/campaignService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';


interface CampaignActionsProps {
  campaign: Campaign;
  clientId: string;
  onEdit: (campaign: Campaign) => void;
  onRefresh: () => void;
  className?: string;
}

/**
 * Affiche les actions possibles pour une campagne (modifier, dupliquer, supprimer).
 * @param {Campaign} campaign - L'objet de la campagne sur lequel les actions s'appliquent.
 * @param {string} clientId - L'ID du client propriétaire de la campagne.
 * @param {(campaign: Campaign) => void} onEdit - Fonction de rappel à exécuter lorsque l'utilisateur clique sur "Modifier".
 * @param {() => void} onRefresh - Fonction de rappel pour rafraîchir la liste des campagnes après une action.
 * @param {string} [className] - Classes CSS optionnelles pour le conteneur principal.
 * @returns {React.ReactElement} Le composant JSX des actions de campagne.
 */
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
  const { t } = useTranslation();


  /**
   * Appelle la fonction onEdit passée en props avec la campagne actuelle
   * et ferme le menu d'actions.
   */
  const handleEdit = () => {
    onEdit(campaign);
    setShowMenu(false);
  };

  /**
   * Gère la suppression d'une campagne après confirmation de l'utilisateur.
   * Met à jour l'état de chargement et rafraîchit la liste des campagnes en cas de succès.
   */
  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la campagne "${campaign.CA_Name}" ?\n\nCette action est irréversible et supprimera également toutes les tactiques, versions et autres données associées.`)) {
      return;
    }

    try {
      setIsLoading(true);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignActions.tsx - Fonction: handleDelete - Path: clients/${clientId}/campaigns/${campaign.id}`);
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

  /**
   * Gère la duplication d'une campagne.
   * Crée un nouveau nom pour la campagne dupliquée, appelle le service de duplication,
   * et rafraîchit la liste des campagnes en cas de succès.
   */
  const handleDuplicate = async () => {
    if (!user?.email) {
      alert('Utilisateur non connecté.');
      return;
    }

    const newName = `${campaign.CA_Name} - Copie`;

    try {
      setIsLoading(true);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignActions.tsx - Fonction: handleDuplicate - Path: clients/${clientId}/campaigns/${campaign.id}`);
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

  /**
   * Hook d'effet pour fermer le menu d'actions si l'utilisateur clique en dehors de celui-ci.
   * Ajoute un écouteur d'événements au document lorsque le menu est visible.
   */
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className={`relative ${className}`}>
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
              {t('common.edit')}
            </button>
            <button
              onClick={handleDuplicate}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              {t('common.duplicate')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>

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

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
}