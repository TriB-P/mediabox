'use client';

import React from 'react';
import { Section } from '../../types/tactiques';

interface TactiquesTotalsProps {
  sections: Section[];
  totalBudget: number;
  formatCurrency: (amount: number) => string;
}

export default function TactiquesTotals({
  sections,
  totalBudget,
  formatCurrency
}: TactiquesTotalsProps) {
  // Calculer le budget total alloué
  const totalAllocated = sections.reduce((total, section) => total + (section.SECTION_Budget || 0), 0);
  
  // Calculer le budget restant
  const remainingBudget = totalBudget - totalAllocated;
  
  // Fonction pour calculer le pourcentage
  const calculatePercentage = (amount: number) => {
    if (totalBudget <= 0) return 0;
    return Math.round((amount / totalBudget) * 100);
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Résumé du budget
        </h3>
        
        <div className="mt-5 border-t border-gray-200 pt-4">
          <dl className="divide-y divide-gray-200">
            {/* Budget total */}
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Budget total</dt>
              <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalBudget)}</dd>
            </div>
            
            {/* Budget alloué */}
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Budget alloué</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(totalAllocated)} 
                <span className="ml-1 text-xs text-gray-500">
                  ({calculatePercentage(totalAllocated)}%)
                </span>
              </dd>
            </div>
            
            {/* Budget restant */}
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Budget restant</dt>
              <dd className={`text-sm font-medium ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remainingBudget)}
                <span className="ml-1 text-xs text-gray-500">
                  ({calculatePercentage(remainingBudget)}%)
                </span>
              </dd>
            </div>
          </dl>
        </div>
        
        {/* Barre de progression */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${remainingBudget < 0 ? 'bg-red-500' : 'bg-indigo-500'}`} 
              style={{ width: `${Math.min(100, (totalAllocated / totalBudget) * 100)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Détails par section */}
        {sections.length > 0 && (
          <div className="mt-5 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Répartition par section</h4>
            
            <ul className="space-y-2">
              {sections
                .sort((a, b) => (b.SECTION_Budget || 0) - (a.SECTION_Budget || 0)) // Trier par budget décroissant
                .map(section => {
                  const percentage = calculatePercentage(section.SECTION_Budget || 0);
                  
                  return (
                    <li key={section.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: section.SECTION_Color || '#6366f1' }}
                        ></div>
                        <span className="text-gray-600">{section.SECTION_Name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(section.SECTION_Budget || 0)}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({percentage}%)
                        </span>
                      </div>
                    </li>
                  );
                })}
            </ul>
            
            {/* Graphique en anneau */}
            <div className="mt-4 flex justify-center">
              <div className="relative w-32 h-32">
                {sections.map((section, index) => {
                  const percentage = calculatePercentage(section.SECTION_Budget || 0);
                  const previousSections = sections.slice(0, index);
                  const previousTotal = previousSections.reduce(
                    (total, s) => total + calculatePercentage(s.SECTION_Budget || 0),
                    0
                  );
                  
                  return (
                    <div 
                      key={section.id}
                      className="absolute inset-0"
                      style={{
                        background: `conic-gradient(transparent ${previousTotal}%, ${section.SECTION_Color || '#6366f1'} ${previousTotal}%, ${section.SECTION_Color || '#6366f1'} ${previousTotal + percentage}%, transparent ${previousTotal + percentage}%)`,
                        borderRadius: '50%'
                      }}
                    ></div>
                  );
                })}
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {calculatePercentage(totalAllocated)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}