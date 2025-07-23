/**
 * Ce fichier représente la page des documents de l'application.
 * Il permet de tester la génération de documents via Google Sheets et le nettoyage de données provenant de Firebase.
 * C'est une page de test pour les fonctionnalités liées aux documents.
 */
'use client';

import React, { useState } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { useGenerateDoc } from '../hooks/documents/useGenerateDoc';
import { useCleanDocData } from '../hooks/documents/useCleanDocData';
import { FileText, Download, AlertCircle, CheckCircle, Database } from 'lucide-react';

/**
 * Composant principal pour la page des documents.
 * Permet de déclencher et d'afficher les résultats des tests de génération et de nettoyage de documents.
 * @returns {JSX.Element} Le composant de la page des documents.
 */
export default function DocumentsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { generateDocument, loading, error } = useGenerateDoc();

  const { cleanData, loading: cleanLoading, error: cleanError, data: cleanedData } = useCleanDocData();

  const TEST_CONFIG = {
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1mt_vSmoZOb0_8YYHPzGB02f0Aby3IbiUdBf3eAbvTFk/edit',
    sheetName: 'Test'
  };

  const CLEAN_TEST_CONFIG = {
    clientId: '46bc9dd4',
    campaignId: 'YuRAhYKqKiTvUQOfXPwd',
    versionId: 'hShB62xJQhyG978FqBXZ'
  };

  /**
   * Gère le test de génération de document.
   * Déclenche la fonction `generateDocument` avec des paramètres de test et met à jour l'état du résultat.
   * @returns {Promise<void>}
   */
  const handleGenerateTest = async () => {
    try {
      setIsGenerating(true);
      setResult(null);

      const success = await generateDocument(
        TEST_CONFIG.sheetUrl,
        TEST_CONFIG.sheetName
      );

      if (success) {
        setResult({
          success: true,
          message: `✅ "TEST" a été écrit avec succès dans la cellule A1 de l'onglet "${TEST_CONFIG.sheetName}"`
        });
      } else {
        setResult({
          success: false,
          message: '❌ Erreur lors de l\'écriture dans Google Sheets'
        });
      }
    } catch (err) {
      console.error('Erreur lors de la génération:', err);
      setResult({
        success: false,
        message: `❌ Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Gère le test de nettoyage des données.
   * Déclenche la fonction `cleanData` avec des paramètres de test.
   * @returns {Promise<void>}
   */
  const handleCleanDataTest = async () => {
    try {
      await cleanData(
        CLEAN_TEST_CONFIG.clientId,
        CLEAN_TEST_CONFIG.campaignId,
        CLEAN_TEST_CONFIG.versionId
      );
    } catch (err) {
      console.error('Erreur lors du nettoyage:', err);
    }
  };

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="space-y-6">

          {/* ==================== EN-TÊTE ==================== */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-500">
                  Génération et gestion des documents
                </p>
              </div>
            </div>
          </div>

          {/* ==================== DESCRIPTION ==================== */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">Module Documents - Version Test</p>
                <p className="text-blue-700">
                  Cette version de test permet de vérifier la connexion avec l'API Google Sheets
                  et le nettoyage des données depuis Firebase.
                </p>
              </div>
            </div>
          </div>

          {/* ==================== CONFIGURATION TEST GOOGLE SHEETS ==================== */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Test Google Sheets</h2>
              <p className="mt-1 text-sm text-gray-500">
                Paramètres hard-codés pour le test d'écriture
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Google Sheets
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600 font-mono break-all">
                  {TEST_CONFIG.sheetUrl}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'onglet
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600">
                  {TEST_CONFIG.sheetName}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGenerateTest}
                  disabled={isGenerating || loading}
                  className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium ${
                    isGenerating || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {isGenerating || loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-3" />
                      Générer Document Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ==================== CONFIGURATION TEST NETTOYAGE DONNÉES ==================== */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Test Nettoyage des Données</h2>
              <p className="mt-1 text-sm text-gray-500">
                Extraction et nettoyage des données depuis Firebase
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600 font-mono">
                  {CLEAN_TEST_CONFIG.clientId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign ID
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600 font-mono">
                  {CLEAN_TEST_CONFIG.campaignId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version ID
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600 font-mono">
                  {CLEAN_TEST_CONFIG.versionId}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCleanDataTest}
                  disabled={cleanLoading}
                  className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium ${
                    cleanLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
                >
                  {cleanLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Nettoyage en cours...
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-3" />
                      Test Nettoyage Données
                    </>
                  )}
                </button>

                {cleanLoading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-pulse">Extraction des données Firebase...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================== AFFICHAGE DU TABLEAU NETTOYÉ ==================== */}
          {cleanedData && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Données Nettoyées</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tableau 2D prêt pour l'export ({cleanedData.length} lignes × {cleanedData[0]?.length || 0} colonnes)
                </p>
              </div>

              <div className="px-6 py-4">
                <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {cleanedData[0]?.map((header: string, index: number) => (
                          <th
                            key={index}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cleanedData.slice(1).map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 max-w-xs truncate"
                              title={cell}
                            >
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== RÉSULTATS ==================== */}
          {result && (
            <div className={`rounded-lg p-4 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Succès' : 'Erreur'}
                  </h3>
                  <p className={`mt-1 text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ERREURS GLOBALES ==================== */}
          {(error || cleanError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {error || cleanError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== INSTRUCTIONS DÉVELOPPEUR ==================== */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium text-gray-800">📝 Instructions pour le développeur :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Créer le hook useCleanDocData dans app/hooks/documents/useCleanDocData.ts</li>
                <li>Créer la configuration de mapping dans app/config/documentMapping.ts</li>
                <li>Tester avec les IDs hard-codés puis permettre la sélection dynamique</li>
                <li>Optimiser les appels Firebase pour éviter les requêtes redondantes</li>
              </ul>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}