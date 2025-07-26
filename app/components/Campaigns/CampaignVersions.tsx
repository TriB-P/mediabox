/**
 * Ce composant React gère l'affichage et les interactions avec les versions d'une campagne spécifique.
 * Il permet aux utilisateurs de voir la liste des versions, d'en créer une nouvelle, de supprimer
 * une version existante et de désigner une version comme "officielle".
 * Ce composant est conçu pour être utilisé dans la page de détails d'une campagne.
 */
'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getVersions,
  createVersion,
  setOfficialVersion,
  deleteVersion,
  Version,
  VersionFormData
} from '../../lib/versionService';

interface CampaignVersionsProps {
  clientId: string;
  campaignId: string;
  officialVersionId?: string;
  onVersionChange?: () => void;
}

/**
 * Affiche et gère les versions d'une campagne.
 * @param {CampaignVersionsProps} props - Les propriétés du composant.
 * @param {string} props.clientId - L'ID du client.
 * @param {string} props.campaignId - L'ID de la campagne.
 * @param {string} [props.officialVersionId] - L'ID de la version officielle actuelle.
 * @param {() => void} [props.onVersionChange] - Callback exécuté lorsqu'une version est modifiée (créée, supprimée, définie comme officielle).
 * @returns {JSX.Element} Le composant de gestion des versions de la campagne.
 */
export default function CampaignVersions({
  clientId,
  campaignId,
  officialVersionId,
  onVersionChange,
}: CampaignVersionsProps) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [clientId, campaignId]);

  /**
   * Charge les versions de la campagne depuis Firebase.
   * Met à jour l'état du composant avec les données récupérées.
   */
  const loadVersions = async () => {
    try {
      setLoading(true);
      console.log(`FIREBASE: LECTURE - Fichier: CampaignVersions.tsx - Fonction: loadVersions - Path: clients/${clientId}/campaigns/${campaignId}/versions`);
      const data = await getVersions(clientId, campaignId);
      setVersions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des versions:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère la création d'une nouvelle version pour la campagne.
   * La fonction est déclenchée par le formulaire de création.
   */
  const handleCreateVersion = async () => {
    if (!newVersionName.trim() || !user?.email) return;

    try {
      setCreating(true);
      const formData: VersionFormData = {
        name: newVersionName
      };
      
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignVersions.tsx - Fonction: handleCreateVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions`);
      await createVersion(clientId, campaignId, formData, user.email);
      setNewVersionName('');
      setCreating(false);
      await loadVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Erreur lors de la création de la version:', error);
      alert(t('campaigns.versions.createError'));
    } finally {
      setCreating(false);
    }
  };

  /**
   * Définit une version sélectionnée comme la version officielle de la campagne.
   * @param {string} versionId - L'ID de la version à définir comme officielle.
   */
  const handleSetOfficial = async (versionId: string) => {
    try {
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignVersions.tsx - Fonction: handleSetOfficial - Path: clients/${clientId}/campaigns/${campaignId}`);
      await setOfficialVersion(clientId, campaignId, versionId);
      await loadVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Erreur lors du changement de version officielle:', error);
      alert(t('campaigns.versions.officialError'));
    }
  };

  /**
   * Gère la suppression d'une version après confirmation de l'utilisateur.
   * Empêche la suppression de la version officielle.
   * @param {Version} version - L'objet de la version à supprimer.
   */
  const handleDeleteVersion = async (version: Version) => {
    if (version.isOfficial) {
      alert(t('campaigns.versions.deleteOfficialError'));
      return;
    }

    if (!confirm(t('campaigns.versions.deleteConfirmMessage', { name: version.name }))) {
      return;
    }

    try {
      setDeletingVersionId(version.id);
      console.log(`FIREBASE: ÉCRITURE - Fichier: CampaignVersions.tsx - Fonction: handleDeleteVersion - Path: clients/${clientId}/campaigns/${campaignId}/versions/${version.id}`);
      await deleteVersion(clientId, campaignId, version.id);
      await loadVersions();
      onVersionChange?.();
      alert(t('campaigns.versions.deleteSuccess'));
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la version:', error);
      alert(error.message || t('campaigns.versions.deleteError'));
    } finally {
      setDeletingVersionId(null);
    }
  };

  if (loading) {
    return (
      <div className="pl-8 py-2 text-sm text-gray-500">
        {t('campaigns.versions.loading')}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-6 py-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900">{t('campaigns.versions.title')}</h3>
        <button
          onClick={() => setCreating(true)}
          disabled={creating}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          {t('campaigns.versions.newVersion')}
        </button>
      </div>

      <div className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between bg-white px-4 py-2 rounded-md border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSetOfficial(version.id)}
                className="focus:outline-none"
                title={
                  version.isOfficial
                    ? t('campaigns.versions.isOfficialTitle')
                    : t('campaigns.versions.setOfficialTitle')
                }
              >
                {version.isOfficial ? (
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {version.name}
                  </span>
                  {version.isOfficial && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t('campaigns.versions.official')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {t('campaigns.versions.createdBy', { 
                    user: version.createdBy, 
                    date: new Date(version.createdAt).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA') 
                  })}
                </div>
              </div>
            </div>

            {!version.isOfficial && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteVersion(version)}
                  disabled={deletingVersionId === version.id}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  title={t('campaigns.versions.deleteVersionTitle')}
                >
                  {deletingVersionId === version.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {creating && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-md border border-primary-300">
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder={t('campaigns.versions.namePlaceholder')}
              className="flex-1 text-sm border-none focus:ring-0"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateVersion();
                } else if (e.key === 'Escape') {
                  setCreating(false);
                  setNewVersionName('');
                }
              }}
            />
            <button
              onClick={handleCreateVersion}
              disabled={!newVersionName.trim() || creating}
              className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              {t('common.create')}
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewVersionName('');
              }}
              disabled={creating}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {versions.length === 0 && !creating && (
          <div className="text-center py-4 text-sm text-gray-500">
            {t('campaigns.versions.noVersions')}
          </div>
        )}
      </div>
    </div>
  );
}