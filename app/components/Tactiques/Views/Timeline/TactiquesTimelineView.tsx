'use client';

import React, { useState } from 'react';
import { Tactique } from '../../../../types/tactiques';

interface TactiquesTimelineViewProps {
  tactiques: Tactique[];
  sectionNames: { [key: string]: string };
  campaignStartDate: string;
  campaignEndDate: string;
  formatCurrency: (amount: number) => string;
  onEditTactique: (tactiqueId: string, sectionId: string) => void;
}

export default function TactiquesTimelineView({
  tactiques,
  sectionNames,
  campaignStartDate,
  campaignEndDate,
  formatCurrency,
  onEditTactique
}: TactiquesTimelineViewProps) {
  // État pour le filtre par section
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  // Filtrer les tactiques par section si nécessaire
  const filteredTactiques = selectedSection 
    ? tactiques.filter(t => t.TC_SectionId === selectedSection)
    : tactiques;
  
  // Déterminer la période totale de la campagne
  const startDate = new Date(campaignStartDate);
  const endDate = new Date(campaignEndDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Fonction pour calculer la position et la largeur d'une tactique sur la timeline
  const calculateTimelinePosition = (tactique: Tactique) => {
    if (!tactique.TC_StartDate || !tactique.TC_EndDate) {
      return { left: 0, width: '100%', color: '#f3f4f6' }; // Gris clair pour les tactiques sans dates
    }
    
    const tactiqueStart = new Date(tactique.TC_StartDate);
    const tactiqueEnd = new Date(tactique.TC_EndDate);
    
    // S'assurer que la date de début est valide et pas avant le début de la campagne
    const effectiveStart = tactiqueStart < startDate ? startDate : tactiqueStart;
    
    // S'assurer que la date de fin est valide et pas après la fin de la campagne
    const effectiveEnd = tactiqueEnd > endDate ? endDate : tactiqueEnd;
    
    // Calculer la position en pourcentage
    const startOffset = Math.max(0, (effectiveStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    // Couleur selon le statut
    let color = '#fef3c7'; // Jaune pour Planned
    if (tactique.TC_Status === 'Active') color = '#dcfce7'; // Vert pour Active
    if (tactique.TC_Status === 'Completed') color = '#dbeafe'; // Bleu pour Completed
    if (tactique.TC_Status === 'Cancelled') color = '#fee2e2'; // Rouge pour Cancelled
    
    return { left: `${left}%`, width: `${width}%`, color };
  };
  
  // Générer les lignes d'échelle de temps (mois)
  const generateTimeScale = () => {
    const months = [];
    const currentDate = new Date(startDate);
    
    // Ajouter chaque mois dans la période
    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate);
      
      // Calculer la position du mois
      const daysFromStart = Math.ceil((monthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const position = (daysFromStart / totalDays) * 100;
      
      // Formater le mois
      const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short' });
      const year = monthStart.getFullYear();
      
      months.push({
        label: `${monthName} ${year}`,
        position: `${position}%`
      });
      
      // Passer au mois suivant
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };
  
  // Obtenir les mois pour l'échelle de temps
  const timeScale = generateTimeScale();
  
  // Obtenir la liste des sections uniques
  const uniqueSections = Array.from(new Set(tactiques.map(t => t.TC_SectionId)));
  
  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label htmlFor="section-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Filtrer par section
        </label>
        <select
          id="section-filter"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Toutes les sections</option>
          {uniqueSections.map(sectionId => (
            <option key={sectionId} value={sectionId}>
              {sectionNames[sectionId] || 'Section sans nom'}
            </option>
          ))}
        </select>
      </div>
      
      {/* Timeline */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* En-tête avec l'échelle de temps */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative h-8">
            {/* Lignes de mois */}
            {timeScale.map((month, index) => (
              <div 
                key={index} 
                className="absolute h-full border-l border-gray-300"
                style={{ left: month.position }}
              >
                <span className="absolute top-0 -ml-3 text-xs text-gray-500">{month.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Corps de la timeline */}
        <div className="p-4">
          {filteredTactiques.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune tactique à afficher
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTactiques.map(tactique => {
                const { left, width, color } = calculateTimelinePosition(tactique);
                
                return (
                  <div key={tactique.id} className="relative h-12">
                    {/* Étiquette de la tactique */}
                    <div className="absolute top-0 -ml-2 w-24 h-full flex items-center pr-2">
                      <span className="text-sm font-medium truncate">{tactique.TC_Label}</span>
                    </div>
                    
                    {/* Barre de la tactique */}
                    <div 
                      className="absolute h-8 rounded-md border border-gray-300 cursor-pointer hover:border-indigo-500 flex items-center px-2 ml-24"
                      style={{ left, width, backgroundColor: color }}
                      onClick={() => onEditTactique(tactique.id, tactique.TC_SectionId)}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{formatCurrency(tactique.TC_Budget)}</span>
                        <span className="text-xs text-gray-500 truncate">
                          {sectionNames[tactique.TC_SectionId] || 'Section sans nom'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}