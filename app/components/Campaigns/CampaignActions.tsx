/**
 * Fichier: app/components/Campaigns/CampaignActions.tsx
 * Ce fichier définit le composant `CampaignActions`, qui fournit une série de boutons d'action
 * (Modifier, Dupliquer, Supprimer, Recalculer) pour une campagne spécifique. Le composant gère son propre état
 * de chargement et s'adapte à l'affichage sur mobile (menu déroulant) et sur ordinateur (boutons directs).
 * MODIFIÉ : Le bouton "Recalculer" regénère maintenant les calculs budgétaires ET les taxonomies en parallèle.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  CalculatorIcon 
} from '@heroicons/react/24/outline';
import { Campaign } from '../../types/campaign';
import { deleteCampaign, duplicateCampaign } from '../../lib/campaignService';
import { recalculateAllCampaignTactics } from '../../lib/campaignRecalculationService';
import { useAsyncTaxonomyUpdate } from '../../hooks/useAsyncTaxonomyUpdate';
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
 * Affiche les actions possibles pour une campagne (modifier, dupliquer, supprimer, recalculer).
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
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcProgress, setRecalcProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useTranslation();
  const { updateTaxonomiesAsync } = useAsyncTaxonomyUpdate();


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
    if (!confirm(t('campaigns.actions.deleteConfirm', { name: campaign.CA_Name }))) {
      return;
    }

    try {
      setIsLoading(true);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignActions.tsx - Fonction: handleDelete - Path: clients/${clientId}/campaigns/${campaign.id}`);
      await deleteCampaign(clientId, campaign.id);
      onRefresh();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(t('campaigns.actions.deleteError'));
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
      alert(t('campaigns.actions.userNotConnected'));
      return;
    }

    const newName = `${campaign.CA_Name} - Copie`;

    try {
      setIsLoading(true);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignActions.tsx - Fonction: handleDuplicate - Path: clients/${clientId}/campaigns/${campaign.id}`);
      await duplicateCampaign(clientId, campaign.id, user.email, newName);
      onRefresh();
      alert(t('campaigns.actions.duplicateSuccess'));
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      alert(t('campaigns.actions.duplicateError'));
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  /**
   * Gère le recalcul de toutes les tactiques ET la mise à jour des taxonomies de la campagne en parallèle.
   * Demande confirmation, lance les deux processus simultanément avec progression,
   * et rafraîchit les données en cas de succès.
   */
  const handleRecalculate = async () => {
    // Confirmation utilisateur
    const confirmMessage = `Voulez-vous recalculer et mettre à jour la campagne "${campaign.CA_Name}" ?\n\nCela mettra à jour :\n• Tous les calculs budgétaires\n• Les conversions de devises\n• Les valeurs héritées\n• Tous les frais applicables\n• Toutes les taxonomies\n\nCette opération peut prendre quelques minutes.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsRecalculating(true);
      setRecalcProgress(0);
      console.log(`🧮 RECALCUL & TAXONOMIES - Début pour campagne ${campaign.id}`);

      // Préparer les données pour la mise à jour des taxonomies
      const parentData = {
        id: campaign.id,
        name: campaign.CA_Name,
        clientId: clientId
      };

      // Lancer les deux opérations en parallèle
      const [budgetResult] = await Promise.all([
        // Recalcul des budgets avec progression
        recalculateAllCampaignTactics(
          clientId,
          campaign.id,
          (progress) => {
            setRecalcProgress(Math.round(progress * 0.8)); // 80% de la progression pour les budgets
          }
        ),
        // Mise à jour des taxonomies (20% restant sera géré à la fin)
        updateTaxonomiesAsync('campaign', parentData)
      ]);

      // Progression finale
      setRecalcProgress(100);

      console.log(`🧮 RECALCUL & TAXONOMIES - Terminé: ${budgetResult.updatedCount} tactiques mises à jour`);
      
      // Message de succès générique
      const successMessage = `✅ Mise à jour terminée avec succès !\n\n• ${budgetResult.updatedCount} tactiques mises à jour\n• ${budgetResult.versionsProcessed} versions traitées\n• Taxonomies régénérées\n• ${budgetResult.errorsCount} erreurs rencontrées`;
      alert(successMessage);

      // Rafraîchir les données
      onRefresh();

    } catch (error) {
      console.error('Erreur lors du recalcul et mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour';
      alert(`❌ Erreur lors de la mise à jour :\n\n${errorMessage}\n\nVeuillez réessayer ou contacter le support si le problème persiste.`);
    } finally {
      setIsRecalculating(false);
      setRecalcProgress(0);
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

  const isAnyActionLoading = isLoading || isRecalculating;

  return (
    <div className={`relative ${className}`}>
      {/* Menu mobile */}
      <div className="sm:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          disabled={isAnyActionLoading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 z-10 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[150px]">
            <button
              onClick={handleEdit}
              disabled={isAnyActionLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <PencilIcon className="h-4 w-4" />
              {t('common.edit')}
            </button>
            <button
              onClick={handleDuplicate}
              disabled={isAnyActionLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              {t('common.duplicate')}
            </button>
            <button
              onClick={handleRecalculate}
              disabled={isAnyActionLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              <CalculatorIcon className="h-4 w-4" />
              {isRecalculating ? (
                <span>Mise à jour... {recalcProgress}%</span>
              ) : (
                'Recalculer'
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={isAnyActionLoading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>

      {/* Boutons desktop */}
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={handleEdit}
          disabled={isAnyActionLoading}
          className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
          title={t('campaigns.actions.editTitle')}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleDuplicate}
          disabled={isAnyActionLoading}
          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
          title={t('campaigns.actions.duplicateTitle')}
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>

        <button
          onClick={handleRecalculate}
          disabled={isAnyActionLoading}
          className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-colors relative group"
          title={isRecalculating ? `Mise à jour en cours... ${recalcProgress}%` : 'Recalculer tous les budgets, frais et taxonomies'}
        >
          <CalculatorIcon className={`h-4 w-4 ${isRecalculating ? 'animate-pulse text-green-600' : ''}`} />
  
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isAnyActionLoading}
          className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
          title={t('campaigns.actions.deleteTitle')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Indicateur de chargement global */}
      {isAnyActionLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            {isRecalculating && (
              <span className="text-xs text-indigo-600 font-medium">
                Mise à jour... {recalcProgress}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}