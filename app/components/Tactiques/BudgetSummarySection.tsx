
// Dans app/components/Tactiques/BudgetSummarySection.tsx
// Correction des imports et suppression du type dupliqué

'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { createLabelWithHelp } from './TactiqueFormComponents';

// 🔥 CORRECTION: Importer ConvergenceInfo depuis budgetCalculations au lieu de le redéfinir
import type { ConvergenceInfo } from '../../lib/budgetCalculations';

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

// 🔥 SUPPRESSION: ConvergenceInfo est maintenant importé depuis budgetCalculations
// interface ConvergenceInfo {
//   hasConverged: boolean;
//   finalDifference: number;
//   iterations: number;
//   tolerance: number;  // <- Cette propriété n'existe pas dans budgetCalculations
//   targetBudget: number;
//   actualCalculatedTotal: number;
// }

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
    bonusValue: number;
    currency: string;
    exchangeRate: number;
  };
  convergenceInfo?: ConvergenceInfo; // 🔥 Utilise maintenant le type importé
  
  // 🔥 NOUVEAU: Détail des frais calculés par le hook
  feeDetails?: Array<{
    feeId: string;
    name: string;
    amount: number;
    order: number;
  }>;
}


interface BudgetSummarySectionProps {
  budgetSummary: BudgetSummary;
  appliedFees: AppliedFee[];
  clientFees: Fee[];
  campaignCurrency: string;
  exchangeRates: { [key: string]: number };
  onTooltipChange: (tooltip: string | null) => void;
}

// ==================== UTILITAIRES ====================

const getFeeTypeIcon = (calculationType: Fee['FE_Calculation_Type']) => {
  switch (calculationType) {
    case 'Pourcentage budget': return '💰';
    case 'Volume d\'unité': return '💰';
    case 'Unités': return '💰';
    case 'Frais fixe': return '💰';
    default: return '⚙️';
  }
};

// Calculer sur quoi chaque frais s'applique (simplifié)
const calculateFeeApplications = (activeFees: any[], clientFees: Fee[]) => {
  const applications: { [feeId: string]: string } = {};
  
  const sortedFees = [...activeFees].sort((a, b) => a.order - b.order);
  
  for (let i = 0; i < sortedFees.length; i++) {
    const currentFee = sortedFees[i];
    const fee = clientFees.find(f => f.id === currentFee.feeId);
    
    if (!fee) continue;
    
    if (fee.FE_Calculation_Mode === 'Directement sur le budget média') {
      applications[currentFee.feeId] = 'Budget média';
    } else {
      const appliedOn: string[] = ['Budget média'];
      
      for (let j = 0; j < i; j++) {
        const previousFee = clientFees.find(f => f.id === sortedFees[j].feeId);
        if (previousFee) {
          appliedOn.push(previousFee.FE_Name);
        }
      }
      
      if (appliedOn.length === 1) {
        applications[currentFee.feeId] = appliedOn[0];
      } else if (appliedOn.length === 2) {
        applications[currentFee.feeId] = `${appliedOn[0]} + ${appliedOn[1]}`;
      } else {
        applications[currentFee.feeId] = `${appliedOn.slice(0, -1).join(' + ')} + ${appliedOn[appliedOn.length - 1]}`;
      }
    }
  }
  
  return applications;
};

// ==================== COMPOSANTS ====================

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

const ConvergenceMessage = memo<{
  convergenceInfo: ConvergenceInfo;
  currency: string;
}>(({ convergenceInfo, currency }) => {
  
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const absEcart = Math.abs(convergenceInfo.finalDifference);
  const isPositive = convergenceInfo.finalDifference < 0;

  return (
    <div className="px-3 py-2 bg-orange-50 border-t border-orange-200">
      <div className="text-xs text-orange-700">
        <div className="flex items-center justify-between">
          <span className="text-orange-600">
            ⚠️ Calcul approximatif
          </span>
          <span className="font-medium">
            Écart: {isPositive ? '+' : '-'}{formatCurrency(absEcart)} {currency}
          </span>
        </div>
        <div className="mt-1 text-orange-600">
          {isPositive 
            ? 'Le total calculé dépasse le budget visé à cause de la complexité des frais.'
            : 'Le total calculé est en dessous du budget visé à cause de la complexité des frais.'
          }
        </div>
      </div>
    </div>
  );
});

ConvergenceMessage.displayName = 'ConvergenceMessage';

const CurrencyConversion = memo<{
  originalCurrency: string;
  convertedValues: BudgetSummary['convertedValues'];
  onTooltipChange: (tooltip: string | null) => void;
}>(({ originalCurrency, convertedValues, onTooltipChange }) => {
  
  if (!convertedValues) return null;

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
          '🔄 Conversion automatique vers la devise de campagne',
          `Conversion automatique de ${originalCurrency} vers ${convertedValues.currency} en utilisant le taux de change configuré pour le client.`,
          onTooltipChange
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Taux de change ({originalCurrency} → {convertedValues.currency}) :</span>
          <span className="font-mono">{formatExchangeRate(convertedValues.exchangeRate)}</span>
        </div>
      </div>
    </div>
  );
});

CurrencyConversion.displayName = 'CurrencyConversion';

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetSummarySection = memo<BudgetSummarySectionProps>(({
  budgetSummary,
  appliedFees,
  clientFees,
  campaignCurrency,
  exchangeRates,
  onTooltipChange
}) => {
  
  // 🔥 CORRECTION: Créer les frais actifs à partir des données corrigées du hook
  const activeFees = useMemo(() => {
    // Si on a des détails de frais du hook, les utiliser (données corrigées)
    if (budgetSummary?.feeDetails && budgetSummary.feeDetails.length > 0) {
      console.log('✅ Utilisation des feeDetails du hook:', budgetSummary.feeDetails);
      return budgetSummary.feeDetails
        .filter(detail => detail.amount > 0)
        .map(detail => ({
          feeId: detail.feeId,
          fee: clientFees.find(f => f.id === detail.feeId)!,
          calculatedAmount: detail.amount,
          order: detail.order
        }))
        .filter(item => item.fee) // S'assurer que le frais existe
        .sort((a, b) => a.order - b.order);
    }
    
    // Fallback vers l'ancienne méthode si pas de feeDetails
    console.log('⚠️ Fallback vers appliedFees car pas de feeDetails');
    const fees = appliedFees
      .filter(af => af.isActive && af.calculatedAmount > 0)
      .map(af => {
        const fee = clientFees.find(f => f.id === af.feeId);
        return {
          feeId: af.feeId,
          fee: fee!,
          calculatedAmount: af.calculatedAmount,
          order: fee?.FE_Order || 999
        };
      })
      .filter(af => af.fee)
      .sort((a, b) => a.order - b.order);
    
    return fees;
  }, [budgetSummary?.feeDetails, appliedFees, clientFees]);

  // Calculer les applications des frais
  const feeApplications = useMemo(() => {
    return calculateFeeApplications(activeFees, clientFees);
  }, [activeFees, clientFees]);

  // Déterminer si une conversion est nécessaire et possible
  const conversionInfo = useMemo(() => {
    const needsConversion = budgetSummary.currency !== campaignCurrency;
    const hasConvertedValues = !!budgetSummary.convertedValues;
    
    return {
      needsConversion,
      hasConvertedValues,
      showConvertedValues: needsConversion && hasConvertedValues
    };
  }, [budgetSummary.currency, budgetSummary.convertedValues, campaignCurrency]);

  // Utiliser les valeurs converties pour l'affichage principal si disponibles
  const displayValues = conversionInfo.showConvertedValues ? budgetSummary.convertedValues! : budgetSummary;
  const displayCurrency = conversionInfo.showConvertedValues ? campaignCurrency : budgetSummary.currency;

  // 🔥 NOUVEAU: Calculer les montants réels des frais affichés (avec conversion si nécessaire)
  const displayedFeeAmounts = useMemo(() => {
    return activeFees.map(activeFee => {
      let feeAmount = activeFee.calculatedAmount;
      
      // Appliquer la conversion si nécessaire
      if (conversionInfo.showConvertedValues && budgetSummary.convertedValues) {
        feeAmount = feeAmount * budgetSummary.convertedValues.exchangeRate;
      }
      
      return {
        feeId: activeFee.feeId,
        amount: feeAmount,
        originalAmount: activeFee.calculatedAmount
      };
    });
  }, [activeFees, conversionInfo.showConvertedValues, budgetSummary.convertedValues]);

  // 🔥 CORRECTION: Calculer le total des frais à partir des montants réellement affichés
  const displayedTotalFees = useMemo(() => {
    return displayedFeeAmounts.reduce((sum, feeAmount) => sum + feeAmount.amount, 0);
  }, [displayedFeeAmounts]);

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
      {conversionInfo.needsConversion && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            💱 Conversion automatique : {budgetSummary.currency} → {campaignCurrency}
          </div>
          {!conversionInfo.hasConvertedValues && (
            <div className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full">
              ⚠️ Taux de change manquant
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif principal - Format facture */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
          <h3 className="font-semibold text-gray-900">
            Détail des coûts
          </h3>
          <p className="text-sm text-gray-600">
            {conversionInfo.showConvertedValues 
              ? `Montants en ${displayCurrency} (devise de campagne)` 
              : `Devise de la tactique : ${displayCurrency}`}
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {/* Budget média */}
          <SummaryLine
            label="Budget média"
            amount={displayValues.mediaBudget}
            currency={displayCurrency}
            description="Montant net pour les plateformes publicitaires"
            icon="💻"
          />
          
          {/* Bonification si applicable */}
          {displayValues.bonusValue > 0 && (
            <SummaryLine
              label="Bonification négociée"
              amount={displayValues.bonusValue}
              currency={displayCurrency}
              description="Valeur ajoutée gratuite obtenue du partenaire"
              icon="🎁"
              isBonus
            />
          )}
          
          {/* 🔥 CORRECTION: Frais détaillés avec montants corrigés */}
          {activeFees.length > 0 && (
            <>
              <div className="px-3 py-2 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Frais applicables :</span>
              </div>
              {activeFees.map((activeFee, index) => {
                // 🔥 UTILISER LES MONTANTS PRÉ-CALCULÉS
                const displayedAmount = displayedFeeAmounts.find(fa => fa.feeId === activeFee.feeId)?.amount || 0;
                
                // Utiliser l'information d'application calculée
                const appliedOn = feeApplications[activeFee.feeId] || 'Non défini';
                
                return (
                  <SummaryLine
                    key={activeFee.feeId}
                    label={activeFee.fee.FE_Name}
                    amount={displayedAmount}
                    currency={displayCurrency}
                    description={`Appliqué sur : ${appliedOn}`}
                    icon={getFeeTypeIcon(activeFee.fee.FE_Calculation_Type)}
                  />
                );
              })}
              
              {/* 🔥 CORRECTION: Sous-total frais utilise le total calculé */}
              <SummaryLine
                label="Sous-total frais"
                amount={displayedTotalFees}
                currency={displayCurrency}
                isSubtotal
              />
            </>
          )}
          
          {/* 🔥 CORRECTION: Total client recalculé avec les vrais montants */}
          <SummaryLine
            label="TOTAL BUDGET CLIENT"
            amount={displayValues.mediaBudget + displayedTotalFees}
            currency={displayCurrency}
            description="Montant total facturable au client"
            isTotal
          />
        </div>

        {/* Message de convergence discret sous le total */}
        {budgetSummary.convergenceInfo && !budgetSummary.convergenceInfo.hasConverged && (
          <ConvergenceMessage
            convergenceInfo={budgetSummary.convergenceInfo}
            currency={budgetSummary.currency}
          />
        )}
      </div>

      {/* Conversion de devise si nécessaire */}
      {conversionInfo.needsConversion && !conversionInfo.hasConvertedValues && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-red-800 mb-2">
            ⚠️ Conversion de devise impossible
          </h5>
          <div className="text-sm text-red-700 space-y-1">
            <p>Aucun taux de change configuré pour : <strong>{budgetSummary.currency} → {campaignCurrency}</strong></p>
            <p>Veuillez configurer le taux de change dans la section devises du client.</p>
            <p className="text-xs mt-2">Les montants sont affichés dans la devise de la tactique ({budgetSummary.currency}).</p>
          </div>
        </div>
      )}

      {/* Détails de conversion si disponible */}
      {conversionInfo.showConvertedValues && (
        <CurrencyConversion
          originalCurrency={budgetSummary.currency}
          convertedValues={budgetSummary.convertedValues!}
          onTooltipChange={onTooltipChange}
        />
      )}

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