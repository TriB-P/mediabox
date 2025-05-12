'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Version {
  id: string;
  name: string;
  isOfficial: boolean;
  createdAt: string;
  createdBy: string;
}

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

  // Fonction inline temporaire
  const getVersions = async (
    clientId: string,
    campaignId: string
  ): Promise<Version[]> => {
    try {
      console.log('getVersions inline appelé avec:', { clientId, campaignId });
      const versionsRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions'
      );
      const q = query(versionsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);

      console.log('Nombre de versions trouvées:', snapshot.size);

      return snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Version)
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des versions:', error);
      return [];
    }
  };

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
      const versionsRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions'
      );
      const newVersion = {
        name: newVersionName,
        isOfficial: false,
        createdAt: new Date().toISOString(),
        createdBy: user.email,
      };

      await addDoc(versionsRef, newVersion);
      setNewVersionName('');
      setCreating(false);
      await loadVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Erreur lors de la création de la version:', error);
    }
  };

  const handleSetOfficial = async (versionId: string) => {
    try {
      // 1. Retirer le statut officiel de toutes les versions
      const versionsRef = collection(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions'
      );
      const q = query(versionsRef, where('isOfficial', '==', true));
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isOfficial: false })
      );
      await Promise.all(updates);

      // 2. Marquer la nouvelle version comme officielle
      const versionRef = doc(
        db,
        'clients',
        clientId,
        'campaigns',
        campaignId,
        'versions',
        versionId
      );
      await updateDoc(versionRef, { isOfficial: true });

      // 3. Mettre à jour la campagne
      const campaignRef = doc(db, 'clients', clientId, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        officialVersionId: versionId,
      });

      await loadVersions();
      onVersionChange?.();
    } catch (error) {
      console.error('Erreur lors du changement de version officielle:', error);
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
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
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
                <div className="text-sm font-medium text-gray-900">
                  {version.name}
                </div>
                <div className="text-xs text-gray-500">
                  Créée par {version.createdBy} le{' '}
                  {new Date(version.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
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
            />
            <button
              onClick={handleCreateVersion}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Créer
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewVersionName('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
