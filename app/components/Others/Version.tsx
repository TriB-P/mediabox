// app/components/Others/Version.tsx
/**
 * @file Composant pour afficher les informations de version de l'application
 * @summary Ce composant affiche un bouton "Version X.X" qui ouvre un modal avec les nouveautés, versions précédentes et fonctionnalités à venir
 */

'use client';

import { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Info, X } from 'lucide-react';

/**
 * @function Version
 * @summary Composant principal pour l'affichage des informations de version
 * @description Ce composant affiche un bouton dans le bas de la navigation qui ouvre un modal avec trois onglets : version actuelle, versions précédentes, et fonctionnalités à venir
 * @returns {JSX.Element} Le bouton version et le modal associé
 */
export default function Version() {
  const { t, language } = useTranslation();
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [activeVersionTab, setActiveVersionTab] = useState('current');

  // Contenu du modal de version (à personnaliser selon vos besoins)
  const versionContent = {
    current: {
      version: '2.0.2',
      releaseDate: '2024-09-25',
      features: {
        fr: [
            'Ajout des indicateurs de campagnes (Ratio média local et ratio média numérique)',
           
        ],
        en: [
            'Added campaign indicators (Local media ratio and digital media ratio)',
        ]
      }
    },
    previous: [
      {
      version: '2.0.1',
      releaseDate: '2024-09-18',
      features: {
        fr: [
            'Ajout d\'une fonctionnalité de log des versions automatiques pour aider les opérations',
            'Réintroduction du statut des documents',
            'Correction de bugs de conversions de devises dans la vue tableau',
            'Ajout des totaux par section dans la vue répartition',
        ],
        en: [
            'Added an automatic version logging feature to support operations',
            'Reintroduced document status',
            'Fixed currency conversion bugs in table view',
            'Added section totals in distribution view',
        ]
      }
    },
      {
      version: '2.0',
      releaseDate: '2024-09-15',
      features: {
        fr: [
            'Interface utilisateur modernisée',
            'Performances et vitesse de chargement améliorées',
            'Nouvelles fonctionnalités d\'édition en masse pour un flux de travail accéléré',
            'Module de stratégie pour une planification de haut niveau',
            'Module de taxonomie intuitif repensé',
            'Fonctionnalité de versioning des campagnes'
        ],
        en: [
            'Modernized user interface',
            'Improved performance and loading speed',
            'New bulk editing features for an accelerated workflow',
            'Strategy module for high-level planning',
            'Redesigned intuitive taxonomy module',
            'Campaign versioning functionality'
        ]
      }
    },
    {
        version: '1.0',
        releaseDate: '2024-07-25',
        features: {
          fr: ['La version originale de MediaBox', 'Bâti sur AppSheet'],
          en: ['MediaBox original version', 'AppSheet built']
        }
      },

      

    ],
    upcoming: {
      features: {
        fr: [
          'Intégration de type DocuSign pour les MPA',
          'Fonctionnalités IA pour accélérer la création de tactiques',
          'Indicateurs de campagnes',
        ],
        en: [
            'DocuSign-type integration for MSAs',
            'AI functionalities to accelerate tactics creation',
            'Campaign indicators',
        ]
      }
    }
  };

  /**
   * @function renderVersionContent
   * @summary Rendu du contenu selon l'onglet actif
   * @description Affiche le contenu approprié selon l'onglet sélectionné (current, previous, upcoming)
   * @returns {JSX.Element} Le contenu de l'onglet actif
   */
  const renderVersionContent = () => {
    switch (activeVersionTab) {
      case 'current':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b">
              <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                v{versionContent.current.version}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(versionContent.current.releaseDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('navigation.version.whatsNew')}</h4>
              <ul className="space-y-2">
                {versionContent.current.features[language].map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      
      case 'previous':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-3">{t('navigation.version.previousVersions')}</h4>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {versionContent.previous.map((version, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      v{version.version}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(version.releaseDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {version.features[language].map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-sm text-gray-600">• {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'upcoming':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-3">{t('navigation.version.upcomingFeatures')}</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">{t('navigation.version.upcomingDisclaimer')}</p>
            </div>
            <ul className="space-y-2">
              {versionContent.upcoming.features[language].map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* Bouton Version */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsVersionModalOpen(true)}
          className="w-full flex items-center justify-center px-3 py-2 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors duration-200"
        >
          <Info className="h-4 w-4 mr-2" />
          Version 2.0.2
        </button>
      </div>

      {/* Modal de version */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsVersionModalOpen(false)}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('navigation.version.title')}
                  </h3>
                  <button
                    onClick={() => setIsVersionModalOpen(false)}
                    className="rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Onglets */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
                  {[
                    { key: 'current', label: t('navigation.version.current') },
                    { key: 'previous', label: t('navigation.version.previous') },
                    { key: 'upcoming', label: t('navigation.version.upcoming') }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveVersionTab(tab.key)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeVersionTab === tab.key
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contenu */}
                <div className="min-h-[200px]">
                  {renderVersionContent()}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setIsVersionModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}