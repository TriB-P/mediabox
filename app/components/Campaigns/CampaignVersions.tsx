// app/components/Campaigns/CampaignVersions.tsx

'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
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

export default function CampaignVersions({
  clientId,
  campaignId,
  officialVersionId,
  onVersionChange,
}: CampaignVersionsProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [clientId, campaignId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getVersions(clientId, campaignId);
      setVersions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionName.trim() || !user?.email) return;

    try {
      setCreating(true);
      const formData: VersionFormData = {
        name: newVersionName
      };
      
      await createVersion(clientId, campaignId, formData, user.email);
      setNewVersionName('');
      setCreating(false);
      await loadVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Erreur lors de la création de la version:', error);
      alert('Erreur lors de la création de la version. Veuillez réessayer.');
    } finally {
      setCreating(false);
    }
  };

  const handleSetOfficial = async (versionId: string) => {
    try {
      await setOfficialVersion(clientId, campaignId, versionId);
      await loadVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Erreur lors du changement de version officielle:', error);
      alert('Erreur lors du changement de version officielle. Veuillez réessayer.');
    }
  };

  const handleDeleteVersion = async (version: Version) => {
    // Empêcher la suppression de la version officielle
    if (version.isOfficial) {
      alert('Impossible de supprimer la version officielle.');
      return;
    }

    // Message de confirmation avec avertissement
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la version "${version.name}" ?

⚠️ ATTENTION : Cette action est irréversible et supprimera :
• Toutes les tactiques de cette version
• Tous les créatifs associés
• Tous les placements associés
• Toutes les autres données liées à cette version

Voulez-vous vraiment continuer ?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingVersionId(version.id);
      await deleteVersion(clientId, campaignId, version.id);
      await loadVersions();
      onVersionChange?.();
      alert('Version supprimée avec succès.');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la version:', error);
      alert(error.message || 'Erreur lors de la suppression de la version. Veuillez réessayer.');
    } finally {
      setDeletingVersionId(null);
    }
  };

  if (loading) {
    return (
      <div className="pl-8 py-2 text-sm text-gray-500">
        Chargement des versions...
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-6 py-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900">Versions</h3>
        <button
          onClick={() => setCreating(true)}
          disabled={creating}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvelle version
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
                    ? 'Version officielle'
                    : 'Définir comme version officielle'
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
                      Officielle
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Créée par {version.createdBy} le{' '}
                  {new Date(version.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Bouton de suppression */}
            {!version.isOfficial && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteVersion(version)}
                  disabled={deletingVersionId === version.id}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  title="Supprimer cette version"
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
              placeholder="Nom de la version"
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
              Créer
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewVersionName('');
              }}
              disabled={creating}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        )}

        {versions.length === 0 && !creating && (
          <div className="text-center py-4 text-sm text-gray-500">
            Aucune version créée pour cette campagne.
          </div>
        )}
      </div>
    </div>
  );
}