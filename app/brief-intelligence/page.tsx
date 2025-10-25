// app/brief-intelligence/page.tsx
/**
 * Page principale du module Brief Intelligence
 * Permet l'analyse de briefs PDF avec IA et la création interactive d'objets AdCP Media Buy
 * ACCÈS: Admin uniquement
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { redirect } from 'next/navigation';
import { usePermissions } from '../contexts/PermissionsContext';
import { useTranslation } from '../contexts/LanguageContext';
import Navigation from '../components/Others/Navigation';
import FileUploader from './components/FileUploader';
import ChatInterface from './components/ChatInterface';
import StatusTracker from './components/StatusTracker';
import JsonPreview from './components/JsonPreview';
import { 
  BriefSession, 
  ChatMessage, 
  AdCPMediaBuy,
  FieldStatus,
  CompletionStatus,
  ChatResponse,
} from './types';
import {
  createNewSession,
  saveSession,
  loadLastSession,
  savePdfToSession,
  addMessage,
  updateFieldStatuses,
} from './utils/storageHelper';
import { Sparkles, AlertCircle } from 'lucide-react';

// ============================================================================
// ANIMATIONS
// ============================================================================

const ease = [0.25, 0.1, 0.25, 1] as const;

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const blockVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease,
    },
  },
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function BriefIntelligencePage() {
  const { userRole, loading: permissionsLoading } = usePermissions();
  const { t } = useTranslation();
  
  // État de la session
  const [session, setSession] = useState<BriefSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // États d'interface
  const [isPdfAnalyzing, setIsPdfAnalyzing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier les permissions
  const isAdmin = userRole === 'admin';
  if (!permissionsLoading && !isAdmin) {
    redirect('/campaigns');
  }

  /**
   * Initialise ou charge la dernière session au montage
   */
  useEffect(() => {
    const initSession = () => {
      try {
        // Essayer de charger la dernière session
        const lastSession = loadLastSession();
        
        if (lastSession) {
          setSession(lastSession);
        } else {
          // Créer une nouvelle session
          const newSession = createNewSession();
          setSession(newSession);
          saveSession(newSession);
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        // En cas d'erreur, créer une nouvelle session
        const newSession = createNewSession();
        setSession(newSession);
        saveSession(newSession);
      } finally {
        setIsInitializing(false);
      }
    };

    if (!permissionsLoading) {
      initSession();
    }
  }, [permissionsLoading]);

  /**
   * Sauvegarde automatique de la session à chaque changement
   */
  useEffect(() => {
    if (session && !isInitializing) {
      saveSession(session);
    }
  }, [session, isInitializing]);

  /**
   * Gère la sélection d'un fichier PDF
   */
  const handleFileSelect = useCallback(async (file: File, base64: string) => {
    if (!session) return;

    setError(null);
    setIsPdfAnalyzing(true);

    try {
      // Sauvegarder le PDF dans la session
      const updatedSession = { ...session };
      savePdfToSession(updatedSession, base64, file.name, file.size);
      setSession(updatedSession);

      // Appeler l'API d'analyse
      const response = await fetch('/api/brief-intelligence/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: base64,
          existingData: updatedSession.adcpData,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse du PDF');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'analyse');
      }

      // Mettre à jour la session avec les données extraites
      const newSession = { ...updatedSession };
      newSession.adcpData = { ...newSession.adcpData, ...result.data.extractedData };
      newSession.fieldStatuses = result.data.fieldStatuses;
      newSession.missingFields = result.data.missingFields;
      newSession.completeness = result.data.completeness;
      newSession.isComplete = result.data.missingFields.length === 0;
      
      // Ajouter un message système avec le résumé
      addMessage(newSession, {
        role: 'system',
        content: `✅ PDF analysé avec succès!\n\n${result.data.summary}`,
      });

      // Si des champs manquent, poser la première question
      if (result.data.missingFields.length > 0 && result.data.suggestedQuestions?.length > 0) {
        addMessage(newSession, {
          role: 'assistant',
          content: result.data.suggestedQuestions[0],
        });
      } else {
        addMessage(newSession, {
          role: 'assistant',
          content: '🎉 Excellent! Toutes les informations obligatoires ont été extraites du brief. Souhaitez-vous ajouter des informations optionnelles pour optimiser votre campagne?',
        });
      }

      setSession(newSession);
    } catch (err: any) {
      console.error('Error analyzing PDF:', err);
      setError(err.message || 'Erreur lors de l\'analyse du PDF');
    } finally {
      setIsPdfAnalyzing(false);
    }
  }, [session]);

  /**
   * Gère la suppression du fichier PDF
   */
  const handleFileRemove = useCallback(() => {
    if (!session) return;
    
    const updatedSession = { ...session };
    delete updatedSession.pdfBase64;
    delete updatedSession.pdfName;
    delete updatedSession.pdfSize;
    delete updatedSession.lastAnalysisAt;
    
    setSession(updatedSession);
  }, [session]);

  /**
   * Gère l'envoi d'un message dans le chat
   */
  const handleSendMessage = useCallback(async (message: string) => {
    if (!session) return;

    setError(null);

    // Ajouter le message de l'utilisateur
    const updatedSession = { ...session };
    addMessage(updatedSession, {
      role: 'user',
      content: message,
    });
    setSession(updatedSession);

    setIsChatLoading(true);

    try {
      // Appeler l'API du chatbot
      const response = await fetch('/api/brief-intelligence/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: session.id,
          currentData: session.adcpData,
          conversationHistory: session.conversation.slice(-10), // Derniers 10 messages
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec le chatbot');
      }

      const result: ChatResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur du chatbot');
      }

      const newSession = { ...updatedSession };

      // Mettre à jour les données si nécessaire
      if (result.data?.updatedData) {
        newSession.adcpData = { ...newSession.adcpData, ...result.data.updatedData };
      }

      // Mettre à jour les statuts de champs
      if (result.data?.fieldStatuses) {
        updateFieldStatuses(newSession, result.data.fieldStatuses);
      }

      // Mettre à jour les champs manquants et la complétion
      if (result.data?.missingFields !== undefined) {
        newSession.missingFields = result.data.missingFields;
        newSession.isComplete = result.data.missingFields.length === 0;
      }

      if (result.data?.completeness !== undefined) {
        newSession.completeness = result.data.completeness;
      }

      // Ajouter la réponse de l'assistant
      addMessage(newSession, {
        role: 'assistant',
        content: result.data?.message || 'Message reçu.',
      });

      setSession(newSession);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Erreur lors de l\'envoi du message');
      
      // Ajouter un message d'erreur
      const errorSession = { ...updatedSession };
      addMessage(errorSession, {
        role: 'system',
        content: `❌ Erreur: ${err.message}. Veuillez réessayer.`,
      });
      setSession(errorSession);
    } finally {
      setIsChatLoading(false);
    }
  }, [session]);

  // ============================================================================
  // RENDU - LOADING
  // ============================================================================

  if (permissionsLoading || isInitializing) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-700">Erreur lors de l'initialisation de la session</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDU - PAGE PRINCIPALE
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        {/* En-tête */}
        <motion.div 
          className="bg-white shadow-sm border-b border-gray-200"
          variants={blockVariants}
        >
          <div className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Brief Intelligence</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Analysez vos briefs PDF et créez des Media Buys AdCP avec l'IA
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Message d'erreur global */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erreur</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Layout en grille */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne gauche: Upload + Status */}
              <motion.div 
                className="space-y-6"
                variants={blockVariants}
              >
                {/* Upload de fichier */}
                <FileUploader
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  currentFile={
                    session.pdfName
                      ? { name: session.pdfName, size: session.pdfSize || 0 }
                      : null
                  }
                  isAnalyzing={isPdfAnalyzing}
                  disabled={isChatLoading}
                />

                {/* Status Tracker */}
                <StatusTracker
                  fieldStatuses={session.fieldStatuses}
                  adcpData={session.adcpData}
                  completeness={session.completeness}
                  missingFields={session.missingFields}
                />
              </motion.div>

              {/* Colonne droite: Chat + JSON Preview */}
              <motion.div 
                className="lg:col-span-2 space-y-6"
                variants={blockVariants}
              >
                {/* Interface de chat */}
                <div className="h-[500px]">
                  <ChatInterface
                    messages={session.conversation}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                    disabled={isPdfAnalyzing}
                    placeholder="Posez vos questions ou donnez des informations sur votre campagne..."
                  />
                </div>

                {/* Prévisualisation JSON */}
                <JsonPreview
                  data={session.adcpData}
                  isComplete={session.isComplete}
                  completeness={session.completeness}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}