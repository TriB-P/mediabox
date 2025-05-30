// app/components/Tactiques/BudgetSummarySection.tsx

'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// ==================== TYPES ====================

interface Fee {
  id: string;
  FE_Name: string;
  FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
  FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
  FE_Order: number;
}

interface AppliedFee {
  feeId: string;
  isActive: boolean;
  calculatedAmount: number;
}

interface BudgetSummary {
  mediaBudget: number;
  totalFees: number;
  clientBudget: number;
  bonusValue: number;
  currency: string;
  convertedValues?: {
    mediaBudget: number;
    totalFees: number;
    clientBudget: number;
    currency: string;
    exchangeRate: number;
  };
}

interface BudgetSummarySectionProps {
  // Données du résumé
  budgetSummary: BudgetSummary;
  appliedFees: AppliedFee[];
  clientFees: Fee[];
  campaignCurrency: string;
  
  // Gestionnaires d'événements
  onTooltipChange: (tooltip: string | null) => void;
}

// ==================== UTILITAIRES ====================

const getFeeTypeIcon = (calculationType: Fee['FE_Calculation_Type']) => {
  switch (calculationType) {
    case 'Pourcentage budget': return '📊';
    case 'Volume d\'unité': return '📈';
    case 'Unités': return '🔢';
    case 'Frais fixe': return '💰';
    default: return '⚙️';
  }
};

// ==================== COMPOSANTS ====================

/**
 * Ligne de détail dans le récapitulatif
 */
const SummaryLine = memo<{
  label: string;
  amount: number;
  currency: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isBonus?: boolean;
  description?: string;
  icon?: string;
}>(({ 
  label, 
  amount, 
  currency, 
  isSubtotal = false, 
  isTotal = false, 
  isBonus = false,
  description,
  icon 
}) => {
  
  const formatCurrency = useCallback((value: number, curr: string) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const lineClass = useMemo(() => {
    if (isTotal) return 'text-lg font-bold text-gray-900 bg-gray-50 border-t-2 border-gray-300';
    if (isSubtotal) return 'text-md font-semibold text-gray-800 border-t border-gray-200';
    if (isBonus) return 'text-sm text-green-700 bg-green-50';
    return 'text-sm text-gray-700';
  }, [isTotal, isSubtotal, isBonus]);

  return (
    <div className={`flex justify-between items-center py-2 px-3 ${lineClass}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        <div>
          <span>{label}</span>
          {description && (
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className={isBonus ? 'font-medium' : 'font-mono'}>
          {isBonus ? '+' : ''}{formatCurrency(amount, currency)}
        </span>
      </div>
    </div>
  );
});

SummaryLine.displayName = 'SummaryLine';

/**
 * Section de conversion de devise
 */
const CurrencyConversion = memo<{
  originalCurrency: string;
  convertedValues: BudgetSummary['convertedValues'];
  onTooltipChange: (tooltip: string | null) => void;
}>(({ originalCurrency, convertedValues, onTooltipChange }) => {
  
  if (!convertedValues) return null;

  const formatCurrency = useCallback((value: number, currency: string) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const formatExchangeRate = useCallback((rate: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(rate);
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
      <div className="flex items-center gap-3 mb-3">
        {createLabelWithHelp(
          '🔄 Conversion de devise',
          `Conversion automatique de ${originalCurrency} vers ${convertedValues.currency} en utilisant le taux de change configuré pour le client.`,
          onTooltipChange
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Taux de change ({originalCurrency} → {convertedValues.currency}) :</span>
          <span className="font-mono">{formatExchangeRate(convertedValues.exchangeRate)}</span>
        </div>
        
        <div className="space-y-1 pt-2 border-t border-blue-200">
          <div className="flex justify-between">
            <span>Budget média :</span>
            <span className="font-mono">{formatCurrency(convertedValues.mediaBudget, convertedValues.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total frais :</span>
            <span className="font-mono">{formatCurrency(convertedValues.totalFees, convertedValues.currency)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-blue-200 pt-1">
            <span>Budget client total :</span>
            <span className="font-mono">{formatCurrency(convertedValues.clientBudget, convertedValues.currency)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
        💡 Cette conversion utilise les taux configurés dans la section devises du client. 
        Le budget sera facturé dans la devise de la campagne ({convertedValues.currency}).
      </div>
    </div>
  );
});

CurrencyConversion.displayName = 'CurrencyConversion';

/**
 * Indicateurs de performance budgétaire
 */
const BudgetMetrics = memo<{
  budgetSummary: BudgetSummary;
  onTooltipChange: (tooltip: string | null) => void;
}>(({ budgetSummary, onTooltipChange }) => {
  
  const metrics = useMemo(() => {
    const { mediaBudget, totalFees, bonusValue } = budgetSummary;
    
    if (mediaBudget <= 0) return null;
    
    const feePercentage = (totalFees / mediaBudget) * 100;
    const bonusPercentage = (bonusValue / mediaBudget) * 100;
    const effectiveDiscount = bonusValue > 0 ? (bonusValue / (mediaBudget + totalFees)) * 100 : 0;
    
    return {
      feePercentage,
      bonusPercentage,
      effectiveDiscount,
      netSpend: mediaBudget - bonusValue // Ce qui est réellement dépensé
    };
  }, [budgetSummary]);

  const formatPercentage = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  }, []);

  const formatCurrency = useCallback((value: number, currency: string) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  if (!metrics) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
      <div className="flex items-center gap-3 mb-3">
        {createLabelWithHelp(
          '📈 Indicateurs budgétaires',
          'Métriques clés pour analyser l\'efficacité budgétaire et les économies réalisées.',
          onTooltipChange
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-white rounded border">
          <div className="text-lg font-semibold text-orange-600">
            {formatPercentage(metrics.feePercentage)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Frais / Budget média</div>
        </div>
        
        {metrics.bonusPercentage > 0 && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-semibold text-green-600">
              +{formatPercentage(metrics.bonusPercentage)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Bonification obtenue</div>
          </div>
        )}
        
        {metrics.effectiveDiscount > 0 && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-semibold text-blue-600">
              -{formatPercentage(metrics.effectiveDiscount)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Réduction effective</div>
          </div>
        )}
        
        {metrics.netSpend !== budgetSummary.mediaBudget && (
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-lg font-semibold text-purple-600">
              {formatCurrency(metrics.netSpend, budgetSummary.currency)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Dépense réelle</div>
          </div>
        )}
      </div>
    </div>
  );
});

BudgetMetrics.displayName = 'BudgetMetrics';

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetSummarySection = memo<BudgetSummarySectionProps>(({
  budgetSummary,
  appliedFees,
  clientFees,
  campaignCurrency,
  onTooltipChange
}) => {
  
  // Frais actifs triés par ordre
  const activeFees = useMemo(() => {
    return appliedFees
      .filter(af => af.isActive && af.calculatedAmount > 0)
      .map(af => {
        const fee = clientFees.find(f => f.id === af.feeId);
        return {
          ...af,
          fee: fee!,
          order: fee?.FE_Order || 999
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [appliedFees, clientFees]);

  // Déterminer si une conversion est nécessaire
  const needsConversion = budgetSummary.currency !== campaignCurrency;

  // Vérifier si le budget est défini
  const hasValidBudget = budgetSummary.mediaBudget > 0;

  if (!hasValidBudget) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>Récapitulatif budgétaire</strong>
        </p>
        <p className="text-sm mt-1">
          Le récapitulatif sera disponible une fois qu'un budget média sera défini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du récapitulatif */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {createLabelWithHelp(
            '🧾 Récapitulatif budgétaire',
            'Détail complet des coûts avec frais et total client. Format facture avec conversion de devise si nécessaire.',
            onTooltipChange
          )}
        </div>
        {needsConversion && (
          <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Conversion {budgetSummary.currency} → {campaignCurrency}
          </div>
        )}
      </div>

      {/* Récapitulatif principal - Format facture */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
          <h3 className="font-semibold text-gray-900">Détail des coûts</h3>
          <p className="text-sm text-gray-600">Devise de la tactique : {budgetSummary.currency}</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {/* Budget média */}
          <SummaryLine
            label="Budget média"
            amount={budgetSummary.mediaBudget}
            currency={budgetSummary.currency}
            description="Montant net pour les plateformes publicitaires"
            icon="💻"
          />
          
          {/* Bonification si applicable */}
          {budgetSummary.bonusValue > 0 && (
            <SummaryLine
              label="Bonification négociée"
              amount={budgetSummary.bonusValue}
              currency={budgetSummary.currency}
              description="Valeur ajoutée gratuite obtenue du partenaire"
              icon="🎁"
              isBonus
            />
          )}
          
          {/* Frais détaillés */}
          {activeFees.length > 0 && (
            <>
              <div className="px-3 py-2 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Frais applicables :</span>
              </div>
              {activeFees.map(appliedFee => (
                <SummaryLine
                  key={appliedFee.feeId}
                  label={appliedFee.fee.FE_Name}
                  amount={appliedFee.calculatedAmount}
                  currency={budgetSummary.currency}
                  description={`${appliedFee.fee.FE_Calculation_Type} • Ordre #${appliedFee.fee.FE_Order}`}
                  icon={getFeeTypeIcon(appliedFee.fee.FE_Calculation_Type)}
                />
              ))}
              
              {/* Sous-total frais */}
              <SummaryLine
                label="Sous-total frais"
                amount={budgetSummary.totalFees}
                currency={budgetSummary.currency}
                isSubtotal
              />
            </>
          )}
          
          {/* Total client */}
          <SummaryLine
            label="TOTAL BUDGET CLIENT"
            amount={budgetSummary.clientBudget}
            currency={budgetSummary.currency}
            description="Montant total facturable au client"
            isTotal
          />
        </div>
      </div>

      {/* Conversion de devise si nécessaire */}
      {needsConversion && budgetSummary.convertedValues && (
        <CurrencyConversion
          originalCurrency={budgetSummary.currency}
          convertedValues={budgetSummary.convertedValues}
          onTooltipChange={onTooltipChange}
        />
      )}

      {/* Indicateurs de performance */}
      <BudgetMetrics
        budgetSummary={budgetSummary}
        onTooltipChange={onTooltipChange}
      />

      {/* Informations complémentaires */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-800 mb-2">
          ℹ️ Informations importantes
        </h5>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• Le budget média représente le montant effectivement dépensé sur les plateformes</p>
          <p>• Les frais s'ajoutent au budget média pour former le budget client total</p>
          <p>• La bonification n'affecte pas les calculs de frais mais améliore le ROI</p>
          {needsConversion && (
            <p>• La conversion de devise utilise les taux configurés dans la section client</p>
          )}
          <p>• Ce récapitulatif peut servir de base pour la facturation client</p>
        </div>
      </div>

      {/* Message si aucun frais */}
      {activeFees.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            💡 Aucun frais appliqué. Le budget client correspond au budget média.
            Vous pouvez activer des frais dans la section précédente si nécessaire.
          </p>
        </div>
      )}
    </div>
  );
});

BudgetSummarySection.displayName = 'BudgetSummarySection';

export default BudgetSummarySection;