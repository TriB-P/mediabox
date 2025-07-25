// app/components/LoadingScreen.tsx

/**
 * Composant d'écran de chargement full-screen pour l'initialisation du cache.
 * Affiche le progrès détaillé du chargement des clients et des listes avec animations élégantes.
 */

import React from 'react';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  details?: string;
}

interface LoadingScreenProps {
  isVisible: boolean;
  currentStep: string;
  steps: LoadingStep[];
  progress: number; // 0-100
  currentDetails?: string;
}

/**
 * Composant d'écran de chargement avec étapes détaillées et animations fluides.
 */
export default function LoadingScreen({ 
  isVisible, 
  currentStep, 
  steps, 
  progress, 
  currentDetails 
}: LoadingScreenProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4">
        
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img 
              src="/images/loading.gif" 
              alt="Chargement" 
              className="w-16 h-16 mx-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Initialisation
          </h1>
          <p className="text-gray-600">
            Préparation de vos données...
          </p>
        </div>

        {/* Barre de progrès principale */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progrès global</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Étapes détaillées */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              
              {/* Icône de statut */}
              <div className="flex-shrink-0 w-6 h-6 mr-3">
                {step.status === 'completed' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {step.status === 'loading' && (
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
                
                {step.status === 'error' && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {step.status === 'pending' && (
                  <div className="w-6 h-6 bg-gray-300 rounded-full" />
                )}
              </div>

              {/* Texte de l'étape */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'loading' ? 'text-indigo-700' :
                  step.status === 'error' ? 'text-red-700' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </div>
                
                {/* Détails supplémentaires */}
                {step.details && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {step.details}
                  </div>
                )}
                
                {/* Détails de l'étape courante */}
                {step.status === 'loading' && currentDetails && (
                  <div className="text-xs text-indigo-600 mt-1 animate-pulse">
                    {currentDetails}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>



      </div>
    </div>
  );
}