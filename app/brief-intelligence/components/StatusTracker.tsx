// app/brief-intelligence/components/StatusTracker.tsx
/**
 * Composant de suivi du statut des champs AdCP
 * Affiche visuellement quels champs sont complets, partiels ou manquants
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Package,
  Target,
  Calendar,
  DollarSign,
  FileText,
  Settings,
} from 'lucide-react';
import { FieldStatus, CompletionStatus, AdCPMediaBuy } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface StatusTrackerProps {
  fieldStatuses: Record<string, FieldStatus>;
  adcpData: Partial<AdCPMediaBuy>;
  completeness: number;
  missingFields: string[];
}

interface FieldGroup {
  id: string;
  name: string;
  icon: any;
  fields: FieldConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
}

// ============================================================================
// CONFIGURATION DES GROUPES DE CHAMPS
// ============================================================================

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'basic',
    name: 'Informations de base',
    icon: FileText,
    fields: [
      { key: 'buyer_ref', label: 'Référence client', required: true },
      { key: 'campaign_name', label: 'Nom de campagne', required: true },
    ],
  },
  {
    id: 'dates',
    name: 'Dates et période',
    icon: Calendar,
    fields: [
      { key: 'flight_start_date', label: 'Date de début', required: true },
      { key: 'flight_end_date', label: 'Date de fin', required: true },
    ],
  },
  {
    id: 'budget',
    name: 'Budget',
    icon: DollarSign,
    fields: [
      { key: 'total_budget', label: 'Budget total', required: true },
      { key: 'currency', label: 'Devise', required: true },
      { key: 'pricing_model', label: 'Modèle de pricing', required: false },
      { key: 'max_cpm', label: 'CPM maximum', required: false },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventaire',
    icon: Package,
    fields: [
      { key: 'product_ids', label: 'Produits média', required: true },
      { key: 'packages', label: 'Packages', required: true },
    ],
  },
  {
    id: 'objectives',
    name: 'Objectifs',
    icon: Target,
    fields: [
      { key: 'objectives.primary_kpi', label: 'KPI principal', required: false },
      { key: 'objectives.secondary_kpis', label: 'KPIs secondaires', required: false },
      { key: 'objectives.target_metrics', label: 'Métriques cibles', required: false },
    ],
  },
  {
    id: 'other',
    name: 'Autres paramètres',
    icon: Settings,
    fields: [
      { key: 'notes', label: 'Notes', required: false },
      { key: 'brand_safety_requirements', label: 'Brand safety', required: false },
      { key: 'viewability_requirements', label: 'Viewability', required: false },
    ],
  },
];

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function StatusTracker({
  fieldStatuses,
  adcpData,
  completeness,
  missingFields,
}: StatusTrackerProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['basic', 'dates', 'budget', 'inventory']);

  /**
   * Toggle l'expansion d'un groupe
   */
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  /**
   * Obtient le statut d'un champ
   */
  const getFieldStatus = (fieldKey: string): CompletionStatus => {
    if (fieldStatuses[fieldKey]) {
      return fieldStatuses[fieldKey].status;
    }
    
    // Vérifier dans les données
    const value = getNestedValue(adcpData, fieldKey);
    if (value !== undefined && value !== null && value !== '') {
      return CompletionStatus.COMPLETE;
    }
    
    return CompletionStatus.MISSING;
  };

  /**
   * Obtient la valeur d'un champ (supporte les chemins imbriqués)
   */
  const getNestedValue = (obj: any, path: string): any => {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  };

  /**
   * Formate la valeur d'un champ pour affichage
   */
  const formatFieldValue = (fieldKey: string): string => {
    const value = getNestedValue(adcpData, fieldKey);
    
    if (value === undefined || value === null || value === '') {
      return '—';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} élément(s)` : '—';
    }
    
    if (typeof value === 'object') {
      return 'Configuré';
    }
    
    if (typeof value === 'number') {
      if (fieldKey === 'total_budget' || fieldKey === 'max_cpm') {
        return new Intl.NumberFormat('fr-CA', {
          style: 'currency',
          currency: adcpData.currency || 'CAD',
        }).format(value);
      }
      return value.toString();
    }
    
    return String(value);
  };

  /**
   * Calcule les statistiques d'un groupe
   */
  const getGroupStats = (group: FieldGroup) => {
    const total = group.fields.length;
    const complete = group.fields.filter(
      field => getFieldStatus(field.key) === CompletionStatus.COMPLETE
    ).length;
    const required = group.fields.filter(f => f.required).length;
    const requiredComplete = group.fields.filter(
      field => field.required && getFieldStatus(field.key) === CompletionStatus.COMPLETE
    ).length;
    
    return { total, complete, required, requiredComplete };
  };

  /**
   * Détermine la couleur selon le statut
   */
  const getStatusColor = (status: CompletionStatus): string => {
    switch (status) {
      case CompletionStatus.COMPLETE:
        return 'text-green-500';
      case CompletionStatus.PARTIAL:
        return 'text-yellow-500';
      case CompletionStatus.INVALID:
        return 'text-red-500';
      default:
        return 'text-gray-300';
    }
  };

  /**
   * Obtient l'icône selon le statut
   */
  const getStatusIcon = (status: CompletionStatus) => {
    switch (status) {
      case CompletionStatus.COMPLETE:
        return CheckCircle2;
      case CompletionStatus.PARTIAL:
      case CompletionStatus.INVALID:
        return AlertCircle;
      default:
        return Circle;
    }
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* En-tête avec barre de progression */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Statut du Brief
          </h3>
          <span className="text-2xl font-bold text-indigo-600">
            {completeness}%
          </span>
        </div>
        
        {/* Barre de progression */}
        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute top-0 left-0 h-full rounded-full ${
              completeness === 100
                ? 'bg-green-500'
                : completeness >= 75
                ? 'bg-indigo-500'
                : completeness >= 50
                ? 'bg-yellow-500'
                : 'bg-orange-500'
            }`}
          />
        </div>
        
        {/* Compteurs */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-600">
            {Object.values(fieldStatuses).filter(s => s.status === CompletionStatus.COMPLETE).length} complétés
          </span>
          {missingFields.length > 0 && (
            <span className="text-orange-600 font-medium">
              {missingFields.length} manquant{missingFields.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Groupes de champs */}
      <div className="divide-y divide-gray-100">
        {FIELD_GROUPS.map((group) => {
          const stats = getGroupStats(group);
          const isExpanded = expandedGroups.includes(group.id);
          const Icon = group.icon;
          const allRequiredComplete = stats.requiredComplete === stats.required;
          
          return (
            <div key={group.id}>
              {/* En-tête du groupe */}
              <motion.button
                onClick={() => toggleGroup(group.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
              >
                <div className="flex items-center space-x-3">
                  {/* Icône chevron */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </motion.div>
                  
                  {/* Icône du groupe */}
                  <div className={`p-1.5 rounded ${allRequiredComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${allRequiredComplete ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  
                  {/* Nom du groupe */}
                  <span className="font-medium text-gray-900">
                    {group.name}
                  </span>
                </div>
                
                {/* Compteur */}
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    stats.complete === stats.total
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}>
                    {stats.complete}/{stats.total}
                  </span>
                  {stats.required > 0 && !allRequiredComplete && (
                    <span className="text-xs text-orange-600 font-medium">
                      ({stats.requiredComplete}/{stats.required} requis)
                    </span>
                  )}
                </div>
              </motion.button>

              {/* Liste des champs */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-2 space-y-1">
                      {group.fields.map((field) => {
                        const status = getFieldStatus(field.key);
                        const StatusIcon = getStatusIcon(status);
                        const value = formatFieldValue(field.key);
                        
                        return (
                          <div
                            key={field.key}
                            className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <StatusIcon className={`h-4 w-4 flex-shrink-0 ${getStatusColor(status)}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </p>
                                {status === CompletionStatus.COMPLETE && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {value}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}