/**
 * Ce fichier React affiche une vue chronologique (timeline) des tactiques d'une campagne.
 * Il permet de visualiser la durée, le statut et le budget de chaque tactique sur une échelle de temps.
 * Les tactiques peuvent être filtrées par section pour une meilleure lisibilité.
 *
 * Il reçoit en props la liste des tactiques, les noms des sections, les dates de début et de fin de campagne,
 * une fonction pour formater les devises et une fonction de rappel pour l'édition d'une tactique.
 */
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

/**
 * Composant d'affichage des tactiques sur une timeline.
 *
 * @param {TactiquesTimelineViewProps} props - Les propriétés du composant.
 * @param {Tactique[]} props.tactiques - La liste des tactiques à afficher.
 * @param {{ [key: string]: string }} props.sectionNames - Un objet mappant les IDs de section à leurs noms.
 * @param {string} props.campaignStartDate - La date de début de la campagne au format chaîne de caractères.
 * @param {string} props.campaignEndDate - La date de fin de la campagne au format chaîne de caractères.
 * @param {(amount: number) => string} props.formatCurrency - Fonction pour formater un montant en devise.
 * @param {(tactiqueId: string, sectionId: string) => void} props.onEditTactique - Fonction de rappel appelée lors de l'édition d'une tactique.
 * @returns {JSX.Element} Le composant de la timeline des tactiques.
 */
export default function TactiquesTimelineView({
  tactiques,
  sectionNames,
  campaignStartDate,
  campaignEndDate,
  formatCurrency,
  onEditTactique
}: TactiquesTimelineViewProps) {
  const [selectedSection, setSelectedSection] = useState<string>('');

  const filteredTactiques = selectedSection
    ? tactiques.filter(t => t.TC_SectionId === selectedSection)
    : tactiques;

  const startDate = new Date(campaignStartDate);
  const endDate = new Date(campaignEndDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  /**
   * Calcule la position et la largeur d'une tactique sur la timeline.
   *
   * @param {Tactique} tactique - La tactique pour laquelle calculer la position.
   * @returns {{ left: string | number; width: string | number; color: string }} Un objet contenant la position gauche, la largeur et la couleur de la barre de tactique.
   */
  const calculateTimelinePosition = (tactique: Tactique) => {
    if (!tactique.TC_StartDate || !tactique.TC_EndDate) {
      return { left: 0, width: '100%', color: '#f3f4f6' };
    }

    const tactiqueStart = new Date(tactique.TC_StartDate);
    const tactiqueEnd = new Date(tactique.TC_EndDate);

    const effectiveStart = tactiqueStart < startDate ? startDate : tactiqueStart;

    const effectiveEnd = tactiqueEnd > endDate ? endDate : tactiqueEnd;

    const startOffset = Math.max(0, (effectiveStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    let color = '#fef3c7';
    if (tactique.TC_Status === 'Active') color = '#dcfce7';
    if (tactique.TC_Status === 'Completed') color = '#dbeafe';
    if (tactique.TC_Status === 'Cancelled') color = '#fee2e2';

    return { left: `${left}%`, width: `${width}%`, color };
  };

  /**
   * Génère les données pour l'échelle de temps (mois) de la timeline.
   *
   * @returns {{ label: string; position: string }[]} Un tableau d'objets représentant chaque mois avec son libellé et sa position.
   */
  const generateTimeScale = () => {
    const months = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate);

      const daysFromStart = Math.ceil((monthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const position = (daysFromStart / totalDays) * 100;

      const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short' });
      const year = monthStart.getFullYear();

      months.push({
        label: `${monthName} ${year}`,
        position: `${position}%`
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  };

  const timeScale = generateTimeScale();

  const uniqueSections = Array.from(new Set(tactiques.map(t => t.TC_SectionId)));

  return (
    <div className="space-y-4">
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="relative h-8">
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
                    <div className="absolute top-0 -ml-2 w-24 h-full flex items-center pr-2">
                      <span className="text-sm font-medium truncate">{tactique.TC_Label}</span>
                    </div>

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