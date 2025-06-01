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
    bonusValue: number;
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
  exchangeRates: { [key: string]: number };
  
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

// NOUVEAU: Fonction pour calculer sur quoi chaque frais s'applique
const calculateFeeApplications = (activeFees: any[], clientFees: Fee[]) => {
  const applications: { [feeId: string]: string } = {};
  
  // Trier les frais par ordre d'application
  const sortedFees = [...activeFees].sort((a, b) => a.order - b.order);
  
  for (let i = 0; i < sortedFees.length; i++) {
    const currentFee = sortedFees[i];
    const fee = clientFees.find(f => f.id === currentFee.feeId);
    
    if (!fee) continue;
    
    if (fee.FE_Calculation_Mode === 'Directement sur le budget média') {
      applications[currentFee.feeId] = 'Budget média';
    } else {
      // 'Applicable sur les frais précédents'
      const appliedOn: string[] = ['Budget média'];
      
      // Ajouter tous les frais précédents
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

});

BudgetMetrics.displayName = 'BudgetMetrics';

// ==================== COMPOSANT PRINCIPAL ====================

const BudgetSummarySection = memo<BudgetSummarySectionProps>(({
  budgetSummary,
  appliedFees,
  clientFees,
  campaignCurrency,
  exchangeRates,
  onTooltipChange
}) => {
  
  // Frais actifs triés par ordre
  const activeFees = useMemo(() => {
    const fees = appliedFees
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
    
    // Debug: Log pour vérifier l'ordre
    console.log('Frais triés par ordre:', fees.map(f => ({ 
      name: f.fee?.FE_Name, 
      order: f.fee?.FE_Order,
      mappedOrder: f.order 
    })));
    
    return fees;
  }, [appliedFees, clientFees]);

  // NOUVEAU: Calculer les applications des frais
  const feeApplications = useMemo(() => {
    return calculateFeeApplications(activeFees, clientFees);
  }, [activeFees, clientFees]);

  // Calcul de la conversion de devise
  const convertedSummary = useMemo(() => {
    const tacticCurrency = budgetSummary.currency;
    const needsConversion = tacticCurrency !== campaignCurrency;
    
    if (!needsConversion) {
      return budgetSummary;
    }

    // Chercher le taux de change
    const exchangeRateKey = `${tacticCurrency}_${campaignCurrency}`;
    const directRate = exchangeRates[exchangeRateKey];
    const simpleRate = exchangeRates[tacticCurrency]; // Fallback pour la structure simple
    
    const exchangeRate = directRate || simpleRate;
    
    if (!exchangeRate || exchangeRate <= 0) {
      console.warn(`Taux de change non trouvé pour ${tacticCurrency} vers ${campaignCurrency}`);
      return budgetSummary;
    }

    // Appliquer la conversion
    const convertedValues = {
      mediaBudget: budgetSummary.mediaBudget * exchangeRate,
      totalFees: budgetSummary.totalFees * exchangeRate,
      clientBudget: budgetSummary.clientBudget * exchangeRate,
      bonusValue: budgetSummary.bonusValue * exchangeRate,
      currency: campaignCurrency,
      exchangeRate
    };

    return {
      ...budgetSummary,
      convertedValues
    };
  }, [budgetSummary, campaignCurrency, exchangeRates]);

  // Déterminer si une conversion est nécessaire
  const needsConversion = budgetSummary.currency !== campaignCurrency;
  const showConvertedValues = needsConversion && convertedSummary.convertedValues;

  // Utiliser les valeurs converties pour l'affichage principal si disponibles
  const displayValues = showConvertedValues ? convertedSummary.convertedValues! : budgetSummary;
  const displayCurrency = showConvertedValues ? campaignCurrency : budgetSummary.currency;

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
      {needsConversion && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            💱 Conversion automatique : {budgetSummary.currency} → {campaignCurrency}
          </div>
          {!convertedSummary.convertedValues && (
            <div className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full">
              ⚠️ Taux de change manquant
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif principal - Format facture */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
          <h3 className="font-semibold text-gray-900">Détail des coûts</h3>
          <p className="text-sm text-gray-600">
            {showConvertedValues 
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
          
          {/* Frais détaillés */}
          {activeFees.length > 0 && (
            <>
              <div className="px-3 py-2 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">Frais applicables :</span>
              </div>
              {activeFees.map((appliedFee, index) => {
                // Convertir le montant du frais si nécessaire
                const feeAmount = showConvertedValues 
                  ? appliedFee.calculatedAmount * convertedSummary.convertedValues!.exchangeRate
                  : appliedFee.calculatedAmount;
                
                // MODIFIÉ: Utiliser l'information d'application calculée
                const appliedOn = feeApplications[appliedFee.feeId] || 'Non défini';
                
                return (
                  <SummaryLine
                    key={appliedFee.feeId}
                    label={appliedFee.fee.FE_Name}
                    amount={feeAmount}
                    currency={displayCurrency}
                    description={`Appliqué sur : ${appliedOn}`}
                    icon={getFeeTypeIcon(appliedFee.fee.FE_Calculation_Type)}
                  />
                );
              })}
              
              {/* Sous-total frais */}
              <SummaryLine
                label="Sous-total frais"
                amount={displayValues.totalFees}
                currency={displayCurrency}
                isSubtotal
              />
            </>
          )}
          
          {/* Total client */}
          <SummaryLine
            label="TOTAL BUDGET CLIENT"
            amount={displayValues.clientBudget}
            currency={displayCurrency}
            description="Montant total facturable au client"
            isTotal
          />
        </div>
      </div>

      {/* Conversion de devise si nécessaire */}
      {needsConversion && !showConvertedValues && (
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
      {showConvertedValues && (
        <CurrencyConversion
          originalCurrency={budgetSummary.currency}
          convertedValues={convertedSummary.convertedValues!}
          onTooltipChange={onTooltipChange}
        />
      )}

      {/* Indicateurs de performance */}
      <BudgetMetrics
        budgetSummary={showConvertedValues ? convertedSummary : budgetSummary}
        onTooltipChange={onTooltipChange}
      />

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