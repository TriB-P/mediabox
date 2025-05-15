'use client';

import React from 'react';
import { Tactique } from '../types/tactiques';

interface TactiquesIndicateursProps {
  tactiques: Tactique[];
  totalBudget: number;
  campaignStartDate: string;
  campaignEndDate: string;
  formatCurrency: (amount: number) => string;
}

export default function TactiquesIndicateurs({
  tactiques,
  totalBudget,
  campaignStartDate,
  campaignEndDate,
  formatCurrency
}: TactiquesIndicateursProps) {
  // Calculer les statistiques
  const totalTactiques = tactiques.length;
  const budgetAlloue = tactiques.reduce((total, tactique) => total + tactique.TC_Budget, 0);
  const budgetMoyen = totalTactiques > 0 ? budgetAlloue / totalTactiques : 0;
  
  // Calculer la répartition par statut
  const statutStats = tactiques.reduce(
    (stats, tactique) => {
      const status = tactique.TC_Status || 'Planned';
      stats[status] = (stats[status] || 0) + 1;
      return stats;
    },
    {} as Record<string, number>
  );
  
  // Calculer la répartition par mois
  const monthlyStats = tactiques.reduce(
    (stats, tactique) => {
      if (!tactique.TC_StartDate || !tactique.TC_EndDate) return stats;
      
      const startDate = new Date(tactique.TC_StartDate);
      const endDate = new Date(tactique.TC_EndDate);
      
      // Pour chaque mois entre le début et la fin de la tactique
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
        stats[monthKey] = (stats[monthKey] || 0) + (tactique.TC_Budget / monthsBetween(startDate, endDate));
        
        // Passer au mois suivant
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      return stats;
    },
    {} as Record<string, number>
  );
  
  // Fonction pour calculer le nombre de mois entre deux dates
  function monthsBetween(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
      endDate.getMonth() - startDate.getMonth() + 1
    );
  }
  
  // Formater les statistiques mensuelles pour l'affichage
  const formattedMonthlyStats = Object.entries(monthlyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      return {
        label: `${monthName} ${year}`,
        value
      };
    });
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Indicateurs de suivi
        </h3>
        
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Carte des statistiques générales */}
          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Nombre de tactiques
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {totalTactiques}
                </dd>
              </dl>
            </div>
          </div>
          
          {/* Carte du budget moyen */}
          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Budget moyen par tactique
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatCurrency(budgetMoyen)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Répartition par statut */}
        <div className="mt-5 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Répartition par statut</h4>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-yellow-50 rounded-md p-3">
              <div className="text-sm font-medium text-yellow-800">Planifiées</div>
              <div className="text-2xl font-semibold text-yellow-900">{statutStats['Planned'] || 0}</div>
            </div>
            
            <div className="bg-green-50 rounded-md p-3">
              <div className="text-sm font-medium text-green-800">Actives</div>
              <div className="text-2xl font-semibold text-green-900">{statutStats['Active'] || 0}</div>
            </div>
            
            <div className="bg-blue-50 rounded-md p-3">
              <div className="text-sm font-medium text-blue-800">Terminées</div>
              <div className="text-2xl font-semibold text-blue-900">{statutStats['Completed'] || 0}</div>
            </div>
            
            <div className="bg-red-50 rounded-md p-3">
              <div className="text-sm font-medium text-red-800">Annulées</div>
              <div className="text-2xl font-semibold text-red-900">{statutStats['Cancelled'] || 0}</div>
            </div>
          </div>
        </div>
        
        {/* Répartition par mois */}
        {formattedMonthlyStats.length > 0 && (
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Répartition budgétaire mensuelle</h4>
            
            <div className="mt-2">
              <div className="flex items-end space-x-2">
                {formattedMonthlyStats.map((month, index) => {
                  const maxValue = Math.max(...formattedMonthlyStats.map(m => m.value));
                  const heightPercentage = (month.value / maxValue) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-12 bg-indigo-200 rounded-t"
                        style={{ height: `${Math.max(4, heightPercentage)}%`, minHeight: '20px' }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1 w-14 text-center overflow-hidden overflow-ellipsis whitespace-nowrap">
                        {month.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Progression de la campagne */}
        {campaignStartDate && campaignEndDate && (
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Progression de la campagne</h4>
            
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>{new Date(campaignStartDate).toLocaleDateString()}</span>
              <span>{new Date(campaignEndDate).toLocaleDateString()}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              {(() => {
                const start = new Date(campaignStartDate).getTime();
                const end = new Date(campaignEndDate).getTime();
                const now = new Date().getTime();
                const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
                
                return (
                  <div 
                    className="h-2.5 rounded-full bg-indigo-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                );
              })()}
            </div>
            
            <div className="flex justify-center text-xs text-gray-500 mt-1">
              {(() => {
                const start = new Date(campaignStartDate).getTime();
                const end = new Date(campaignEndDate).getTime();
                const now = new Date().getTime();
                const progress = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
                
                return `${Math.round(progress)}% complété`;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}