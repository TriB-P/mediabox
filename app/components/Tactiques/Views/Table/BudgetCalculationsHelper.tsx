// app/components/Tactiques/Views/Table/BudgetCalculationsHelper.tsx

/**
 * Logique de calculs budgétaires complète pour la vue tableau
 * Reproduit fidèlement la logique complexe des composants budget du drawer
 * Inclut : bonification, frais, taux de change, convergence
 */

interface BudgetData {
    // Paramètres de base
    TC_Budget_Mode?: 'client' | 'media';
    TC_Budget?: number;
    TC_Currency?: string;
    TC_Unit_Type?: string;
    TC_Cost_Per_Unit?: number;
    TC_Unit_Volume?: number;
    
    // Bonification
    TC_Has_Bonus?: boolean | string;
    TC_Real_Value?: number;
    TC_Bonus_Value?: number;
    
    // Frais (structure du drawer)
    appliedFees?: AppliedFee[];
    
    // Taux de change
    exchangeRate?: number;
    
    // Autres champs existants pour compatibilité
    [key: string]: any;
}

interface AppliedFee {
    feeId: string;
    isActive: boolean;
    selectedOptionId?: string;
    customValue?: number;
    customUnits?: number;
    useCustomVolume?: boolean;
    customVolume?: number;
    calculatedAmount: number;
}

interface ClientFee {
    id: string;
    FE_Name: string;
    FE_Calculation_Type: 'Pourcentage budget' | 'Volume d\'unité' | 'Unités' | 'Frais fixe';
    FE_Calculation_Mode: 'Directement sur le budget média' | 'Applicable sur les frais précédents';
    FE_Order: number;
    options: {
        id: string;
        FO_Option: string;
        FO_Value: number;
        FO_Buffer: number;
        FO_Editable: boolean;
    }[];
}

interface ConvergenceInfo {
    hasConverged: boolean;
    iterations: number;
    maxIterations: number;
    finalDifference: number;
    tolerance: number;
}

interface BudgetSummary {
    mediaBudget: number;
    totalFees: number;
    clientBudget: number;
    bonusValue: number;
    currency: string;
    unitVolume: number;
    convertedValues?: {
        mediaBudget: number;
        totalFees: number;
        clientBudget: number;
        bonusValue: number;
        currency: string;
        exchangeRate: number;
    };
    convergenceInfo?: ConvergenceInfo;
    feeDetails?: Array<{
        feeId: string;
        name: string;
        amount: number;
        order: number;
    }>;
}

/**
 * Fonction principale de calcul budgétaire reproduisant la logique du drawer
 */
export function calculateBudgetSummary(
    data: BudgetData,
    clientFees: ClientFee[] = [],
    exchangeRates: { [key: string]: number } = {},
    campaignCurrency: string = 'CAD',
    maxIterations: number = 10,
    tolerance: number = 0.01
): BudgetSummary {
    
    const budgetMode = data.TC_Budget_Mode || 'media';
    const inputBudget = data.TC_Budget || 0;
    const currency = data.TC_Currency || 'CAD';
    const unitType = data.TC_Unit_Type || '';
    const costPerUnit = data.TC_Cost_Per_Unit || 0;
    const hasBonus = data.TC_Has_Bonus === true || data.TC_Has_Bonus === 'true';
    const realValue = data.TC_Real_Value || 0;
    const appliedFees = data.appliedFees || [];
    
    // === ÉTAPE 1: Calculer la bonification ===
    let bonusValue = 0;
    if (hasBonus && realValue > 0) {
        // La bonification est calculée différemment selon le mode
        if (budgetMode === 'media') {
            bonusValue = Math.max(0, realValue - inputBudget);
        } else {
            // En mode client, il faut d'abord déduire les frais pour obtenir le budget média
            const estimatedFees = calculateAppliedFees(appliedFees, clientFees, inputBudget, 0).totalFees;
            const estimatedMediaBudget = Math.max(0, inputBudget - estimatedFees);
            bonusValue = Math.max(0, realValue - estimatedMediaBudget);
        }
    }
    
    // === ÉTAPE 2: Calcul avec convergence (pour mode client complexe) ===
    let convergenceInfo: ConvergenceInfo;
    let finalResults: {
        mediaBudget: number;
        clientBudget: number;
        totalFees: number;
        unitVolume: number;
    };
    
    if (budgetMode === 'client' && appliedFees.length > 0) {
        const convergenceResult = calculateWithConvergence(
            inputBudget, appliedFees, clientFees, costPerUnit, unitType, bonusValue, maxIterations, tolerance
        );
        finalResults = convergenceResult.results;
        convergenceInfo = convergenceResult.convergenceInfo;
    } else {
        // Calcul simple pour mode média ou sans frais
        const mediaBudget = budgetMode === 'media' ? inputBudget : inputBudget;
        const feeResults = calculateAppliedFees(appliedFees, clientFees, mediaBudget, 0);
        const totalFees = feeResults.totalFees;
        const clientBudget = budgetMode === 'media' ? mediaBudget + totalFees : inputBudget;
        const actualMediaBudget = budgetMode === 'client' ? Math.max(0, inputBudget - totalFees) : mediaBudget;
        
        const unitVolume = calculateUnitVolume(actualMediaBudget, bonusValue, costPerUnit, unitType);
        
        finalResults = {
            mediaBudget: actualMediaBudget,
            clientBudget,
            totalFees,
            unitVolume
        };
        
        convergenceInfo = {
            hasConverged: true,
            iterations: 1,
            maxIterations,
            finalDifference: 0,
            tolerance
        };
    }
    
    // === ÉTAPE 3: Conversion de devise si nécessaire ===
    let convertedValues: BudgetSummary['convertedValues'];
    const needsConversion = currency !== campaignCurrency;
    const exchangeRate = exchangeRates[`${currency}_${campaignCurrency}`] || 1;
    
    if (needsConversion && exchangeRate !== 1) {
        convertedValues = {
            mediaBudget: finalResults.mediaBudget * exchangeRate,
            totalFees: finalResults.totalFees * exchangeRate,
            clientBudget: finalResults.clientBudget * exchangeRate,
            bonusValue: bonusValue * exchangeRate,
            currency: campaignCurrency,
            exchangeRate
        };
    }
    
    // === ÉTAPE 4: Détails des frais ===
    const feeDetails = appliedFees
        .filter(af => af.isActive && af.calculatedAmount > 0)
        .map(af => {
            const fee = clientFees.find(f => f.id === af.feeId);
            return {
                feeId: af.feeId,
                name: fee?.FE_Name || 'Frais inconnu',
                amount: af.calculatedAmount,
                order: fee?.FE_Order || 999
            };
        })
        .sort((a, b) => a.order - b.order);
    
    return {
        mediaBudget: finalResults.mediaBudget,
        totalFees: finalResults.totalFees,
        clientBudget: finalResults.clientBudget,
        bonusValue,
        currency,
        unitVolume: finalResults.unitVolume,
        convertedValues,
        convergenceInfo,
        feeDetails
    };
}

/**
 * Calcul avec convergence pour le mode client avec frais complexes
 */
function calculateWithConvergence(
    targetClientBudget: number,
    appliedFees: AppliedFee[],
    clientFees: ClientFee[],
    costPerUnit: number,
    unitType: string,
    bonusValue: number,
    maxIterations: number,
    tolerance: number
): {
    results: { mediaBudget: number; clientBudget: number; totalFees: number; unitVolume: number };
    convergenceInfo: ConvergenceInfo;
} {
    
    let currentMediaBudget = targetClientBudget * 0.8; // Estimation initiale
    let hasConverged = false;
    let iterations = 0;
    let finalDifference = 0;
    
    for (let i = 0; i < maxIterations; i++) {
        iterations = i + 1;
        
        // Calculer les frais basés sur le budget média actuel
        const unitVolume = calculateUnitVolume(currentMediaBudget, bonusValue, costPerUnit, unitType);
        const feeResults = calculateAppliedFees(appliedFees, clientFees, currentMediaBudget, unitVolume);
        const totalFees = feeResults.totalFees;
        
        // Calculer le budget client résultant
        const calculatedClientBudget = currentMediaBudget + totalFees;
        
        // Vérifier la convergence
        const difference = Math.abs(calculatedClientBudget - targetClientBudget);
        finalDifference = calculatedClientBudget - targetClientBudget;
        
        if (difference <= tolerance) {
            hasConverged = true;
            break;
        }
        
        // Ajuster le budget média pour la prochaine itération
        const adjustment = (targetClientBudget - calculatedClientBudget) * 0.8; // Facteur d'amortissement
        currentMediaBudget = Math.max(0, currentMediaBudget + adjustment);
    }
    
    // Calcul final
    const finalUnitVolume = calculateUnitVolume(currentMediaBudget, bonusValue, costPerUnit, unitType);
    const finalFeeResults = calculateAppliedFees(appliedFees, clientFees, currentMediaBudget, finalUnitVolume);
    const finalClientBudget = currentMediaBudget + finalFeeResults.totalFees;
    
    return {
        results: {
            mediaBudget: currentMediaBudget,
            clientBudget: finalClientBudget,
            totalFees: finalFeeResults.totalFees,
            unitVolume: finalUnitVolume
        },
        convergenceInfo: {
            hasConverged,
            iterations,
            maxIterations,
            finalDifference,
            tolerance
        }
    };
}

/**
 * Calcule les frais appliqués selon leur configuration
 */
function calculateAppliedFees(
    appliedFees: AppliedFee[],
    clientFees: ClientFee[],
    mediaBudget: number,
    unitVolume: number
): { 
    totalFees: number; 
    feeAmounts: { feeId: string; amount: number }[];
} {
    const feeAmounts: { feeId: string; amount: number }[] = [];
    let totalFees = 0;
    
    // Trier les frais par ordre
    const sortedAppliedFees = appliedFees
        .filter(af => af.isActive)
        .map(af => {
            const fee = clientFees.find(f => f.id === af.feeId);
            return { ...af, order: fee?.FE_Order || 999, fee };
        })
        .filter(af => af.fee)
        .sort((a, b) => a.order - b.order);
    
    let cumulativeBase = mediaBudget;
    
    for (const appliedFee of sortedAppliedFees) {
        const fee = appliedFee.fee!;
        const selectedOption = fee.options.find(opt => opt.id === appliedFee.selectedOptionId);
        
        if (!selectedOption) continue;
        
        // Valeur avec buffer
        const baseValue = appliedFee.customValue !== undefined ? appliedFee.customValue : selectedOption.FO_Value;
        const bufferMultiplier = (100 + selectedOption.FO_Buffer) / 100;
        const finalValue = baseValue * bufferMultiplier;
        
        let calculatedAmount = 0;
        
        switch (fee.FE_Calculation_Type) {
            case 'Pourcentage budget':
                const baseAmount = fee.FE_Calculation_Mode === 'Directement sur le budget média' 
                    ? mediaBudget 
                    : cumulativeBase;
                calculatedAmount = baseAmount * finalValue;
                break;
                
            case 'Volume d\'unité':
                const volume = appliedFee.useCustomVolume && appliedFee.customVolume 
                    ? appliedFee.customVolume 
                    : unitVolume;
                calculatedAmount = finalValue * volume;
                break;
                
            case 'Unités':
                const units = appliedFee.customUnits || 1;
                calculatedAmount = finalValue * units;
                break;
                
            case 'Frais fixe':
                calculatedAmount = finalValue;
                break;
        }
        
        calculatedAmount = Math.round(calculatedAmount * 100) / 100;
        
        feeAmounts.push({
            feeId: appliedFee.feeId,
            amount: calculatedAmount
        });
        
        totalFees += calculatedAmount;
        
        // Mettre à jour la base cumulative si applicable
        if (fee.FE_Calculation_Mode === 'Applicable sur les frais précédents') {
            cumulativeBase += calculatedAmount;
        }
    }
    
    return { totalFees, feeAmounts };
}

/**
 * Calcule le volume d'unités selon la logique du drawer
 */
function calculateUnitVolume(
    mediaBudget: number,
    bonusValue: number,
    costPerUnit: number,
    unitType: string
): number {
    if (costPerUnit <= 0) return 0;
    
    const effectiveBudget = mediaBudget + bonusValue;
    
    if (unitType.toLowerCase().includes('impression')) {
        // Pour CPM : (Budget + Bonification) / CPM * 1000
        return Math.round((effectiveBudget / costPerUnit) * 1000);
    } else {
        // Pour autres unités : (Budget + Bonification) / Coût par unité
        return Math.round(effectiveBudget / costPerUnit);
    }
}

/**
 * Détermine quels champs doivent être recalculés quand un champ change
 */
export function getBudgetFieldDependencies(changedField: string): string[] {
    const allCalculatedFields = [
        'TC_Unit_Volume',
        'TC_Media_Budget', 
        'TC_Client_Budget',
        'TC_Bonus_Value',
        'TC_Total_Fees'
    ];

    switch (changedField) {
        case 'TC_Budget_Mode':
        case 'TC_Budget':
            return allCalculatedFields;
            
        case 'TC_Cost_Per_Unit':
        case 'TC_Unit_Type':
            return ['TC_Unit_Volume'];
            
        case 'TC_Has_Bonus':
        case 'TC_Real_Value':
            return ['TC_Bonus_Value', 'TC_Unit_Volume'];
            
        case 'TC_Currency':
            return allCalculatedFields;
            
        default:
            // Pour les frais ou autres champs
            if (changedField.includes('Fee') || changedField.includes('appliedFees')) {
                return ['TC_Total_Fees', 'TC_Media_Budget', 'TC_Client_Budget'];
            }
            return [];
    }
}

/**
 * Valide si les données sont suffisantes pour effectuer les calculs
 */
export function validateBudgetData(data: BudgetData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.TC_Budget || data.TC_Budget <= 0) {
        errors.push('Budget requis et doit être positif');
    }
    
    if (!data.TC_Budget_Mode) {
        errors.push('Mode de saisie requis');
    }
    
    if (!data.TC_Currency) {
        errors.push('Devise requise');
    }
    
    // Pour calculer le volume, besoin du coût par unité
    if (data.TC_Cost_Per_Unit !== undefined && data.TC_Cost_Per_Unit <= 0) {
        errors.push('Coût par unité doit être positif');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Formate les valeurs pour l'affichage dans le tableau
 */
export function formatBudgetValue(value: any, type: 'currency' | 'number' | 'percentage' | 'text', currency: string = 'CAD'): string {
    if (value === null || value === undefined || value === '') return '';
    
    switch (type) {
        case 'currency':
            const num = Number(value);
            if (isNaN(num)) return String(value);
            return new Intl.NumberFormat('fr-CA', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
            
        case 'number':
            const numVal = Number(value);
            if (isNaN(numVal)) return String(value);
            return new Intl.NumberFormat('fr-CA', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(numVal);
            
        case 'percentage':
            const pctVal = Number(value);
            if (isNaN(pctVal)) return String(value);
            return `${pctVal.toFixed(2)}%`;
            
        default:
            return String(value);
    }
}

