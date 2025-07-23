// app/documents/page.tsx

'use client';

import React, { useState } from 'react';
import ProtectedRoute from '../components/Others/ProtectedRoute';
import AuthenticatedLayout from '../components/Others/AuthenticatedLayout';
import { useGenerateDoc } from '../hooks/documents/useGenerateDoc';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function DocumentsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Hook pour générer le document (sera créé dans le prochain artefact)
  const { generateDocument, loading, error } = useGenerateDoc();

  // Configuration hard-codée pour le test
  const TEST_CONFIG = {
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1mt_vSmoZOb0_8YYHPzGB02f0Aby3IbiUdBf3eAbvTFk/edit',
    sheetName: 'Test'
  };

  const handleGenerateTest = async () => {
    try {
      setIsGenerating(true);
      setResult(null);

      console.log('🚀 Génération du document test...');
      console.log('URL:', TEST_CONFIG.sheetUrl);
      console.log('Onglet:', TEST_CONFIG.sheetName);

      // Appel du hook pour écrire "TEST" dans A1
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
                  Cette version de test permet de vérifier la connexion avec l'API Google Sheets. 
                  Le bouton ci-dessous écrira "TEST" dans la cellule A1 de l'onglet configuré.
                </p>
              </div>
            </div>
          </div>

          {/* ==================== CONFIGURATION TEST ==================== */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuration de Test</h2>
              <p className="mt-1 text-sm text-gray-500">
                Paramètres hard-codés pour le test initial
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-600">
                  Écrire "TEST" dans la cellule A1
                </div>
              </div>
            </div>
          </div>

          {/* ==================== BOUTON D'ACTION ==================== */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Test d'Intégration</h2>
            </div>
            
            <div className="px-6 py-6">
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

                {/* Indicateur de statut */}
                {(isGenerating || loading) && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-pulse">Connexion à Google Sheets...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur du Hook
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {error}
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
                <li>Remplacer "YOUR_SHEET_ID_HERE" par l'ID réel du Google Sheet de test</li>
                <li>Créer le hook useGenerateDoc dans app/hooks/useGenerateDoc.ts</li>
                <li>Configurer les permissions Google Sheets API si nécessaire</li>
                <li>Tester avec un Google Sheet accessible en mode éditeur</li>
              </ul>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}