/**
 * Ce fichier définit un composant React de diagnostic nommé FirestoreExplorer.
 * Son rôle est d'aider les développeurs à visualiser et à vérifier la structure des données
 * dans Firestore pour un client spécifique. Pour un client sélectionné, il lit sa configuration,
 * identifie les "dimensions personnalisées", puis explore les collections et documents
 * correspondants pour afficher un aperçu de la structure existante.
 * C'est un outil purement informatif pour le débogage.
 */
'use client';

import { useEffect, useState } from 'react';
import { useClient } from '../../contexts/ClientContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, query } from 'firebase/firestore';

/**
 * Composant React qui sert d'outil de diagnostic pour explorer la structure de données
 * d'un client spécifique dans Firestore. Il affiche les dimensions personnalisées
 * et les chemins de collections/documents associés.
 * @returns {JSX.Element} L'interface utilisateur de l'explorateur Firestore.
 */
export default function FirestoreExplorer() {
  const { selectedClient } = useClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [customDimNames, setCustomDimNames] = useState<string[]>([]);

  useEffect(() => {
    /**
     * Fonction asynchrone qui explore la base de données Firestore pour un client sélectionné.
     * Elle récupère d'abord les dimensions personnalisées du client, puis vérifie l'existence
     * et le contenu des collections de listes associées à ces dimensions.
     * Les résultats sont stockés dans l'état du composant pour être affichés.
     */
    async function exploreFirestore() {
      if (!selectedClient) return;

      try {
        setLoading(true);
        setError(null);
        const exploredPaths: string[] = [];

        try {
          const clientRef = doc(db, 'clients', selectedClient.clientId);
          console.log(`FIREBASE: LECTURE - Fichier: FirestoreExplorer.tsx - Fonction: exploreFirestore - Path: clients/${selectedClient.clientId}`);
          const clientDoc = await getDoc(clientRef);

          if (clientDoc.exists()) {
            const data = clientDoc.data();
            const dims: string[] = [];

            exploredPaths.push(`clients/${selectedClient.clientId} [Document]`);

            for (const key in data) {
              if (key.startsWith('CA_Custom_Dim_')) {
                dims.push(data[key]);
                exploredPaths.push(`clients/${selectedClient.clientId}/${key} = ${data[key]}`);
              }
            }

            setCustomDimNames(dims);

            for (const dimName of dims) {
              try {
                const shortcodesRef = collection(
                  db,
                  'lists',
                  dimName,
                  'clients',
                  selectedClient.clientId,
                  'shortcodes'
                );

                console.log(`FIREBASE: LECTURE - Fichier: FirestoreExplorer.tsx - Fonction: exploreFirestore - Path: lists/${dimName}/clients/${selectedClient.clientId}/shortcodes`);
                const snapshot = await getDocs(query(shortcodesRef));
                exploredPaths.push(`lists/${dimName}/clients/${selectedClient.clientId}/shortcodes [Collection] - ${snapshot.size} document(s)`);

                if (snapshot.size > 0) {
                  snapshot.docs.slice(0, 3).forEach(doc => {
                    const data = doc.data();
                    exploredPaths.push(`  - Document ID: ${doc.id}`);
                    for (const key in data) {
                      exploredPaths.push(`    - ${key}: ${data[key]}`);
                    }
                  });
                }
              } catch (error) {
                exploredPaths.push(`Erreur: Impossible d'accéder à lists/${dimName}/clients/${selectedClient.clientId}/shortcodes`);
              }

              try {
                const globalShortcodesRef = collection(
                  db,
                  'lists',
                  dimName,
                  'shortcodes'
                );

                console.log(`FIREBASE: LECTURE - Fichier: FirestoreExplorer.tsx - Fonction: exploreFirestore - Path: lists/${dimName}/shortcodes`);
                const snapshot = await getDocs(query(globalShortcodesRef));
                exploredPaths.push(`lists/${dimName}/shortcodes [Collection] - ${snapshot.size} document(s)`);

                if (snapshot.size > 0) {
                  snapshot.docs.slice(0, 3).forEach(doc => {
                    const data = doc.data();
                    exploredPaths.push(`  - Document ID: ${doc.id}`);
                    for (const key in data) {
                      exploredPaths.push(`    - ${key}: ${data[key]}`);
                    }
                  });
                }
              } catch (error) {
                exploredPaths.push(`Erreur: Impossible d'accéder à lists/${dimName}/shortcodes`);
              }
            }
          } else {
            exploredPaths.push(`Client ${selectedClient.clientId} non trouvé dans Firestore`);
          }
        } catch (error) {
          exploredPaths.push(`Erreur lors de l'accès au document client: ${error}`);
        }

        setPaths(exploredPaths);
      } catch (err) {
        setError('Erreur lors de l\'exploration de Firestore');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    exploreFirestore();
  }, [selectedClient]);

  if (!selectedClient) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Veuillez sélectionner un client pour explorer sa structure Firestore.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Explorateur Firestore - {selectedClient.CL_Name}</h2>

      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-500">Exploration de la structure Firestore...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Dimensions personnalisées trouvées:</h3>
        {customDimNames.length > 0 ? (
          <ul className="list-disc pl-5">
            {customDimNames.map((dim, index) => (
              <li key={index} className="text-blue-600">{dim}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Aucune dimension personnalisée trouvée pour ce client.</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Structure explorée:</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm overflow-auto max-h-96">
          {paths.map((path, index) => (
            <div key={index} className="mb-1">{path}</div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">Comment résoudre:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-yellow-800">
          <li>Vérifiez que les chemins <code>lists/[dimName]/clients/[clientId]/shortcodes</code> existent.</li>
          <li>Assurez-vous que chaque collection <code>shortcodes</code> contient des documents.</li>
          <li>Chaque document doit avoir les champs <code>SH_Code</code> et <code>SH_Display_Name_FR</code>.</li>
          <li>Si la structure est différente, adaptez <code>listService.ts</code> pour qu'il corresponde à votre structure.</li>
        </ol>
      </div>
    </div>
  );
}