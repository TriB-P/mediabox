// app/lib/validationMessages.ts

/**
 * Messages de validation standardisés pour les dates
 * Centralise tous les messages d'erreur avec support d'internationalisation
 */

import { formatDateForDisplay } from './dateUtils';
import type { EntityLevel, DateLimits } from './dateValidationService';

// ==================== INTERFACES ====================

export interface ValidationMessageOptions {
  date?: string;
  startDate?: string;
  endDate?: string;
  parentLevel?: EntityLevel;
  parentStartDate?: string;
  parentEndDate?: string;
  currentLevel?: EntityLevel;
  limits?: DateLimits;
}

// ==================== LABELS DES NIVEAUX ====================

const LEVEL_LABELS: Record<EntityLevel, { singular: string; article: string }> = {
  campaign: { singular: 'campagne', article: 'la' },
  tactique: { singular: 'tactique', article: 'la' },
  placement: { singular: 'placement', article: 'le' },
  creatif: { singular: 'créatif', article: 'le' }
};

function getLevelLabel(level: EntityLevel): string {
  return LEVEL_LABELS[level]?.singular || level;
}

function getLevelWithArticle(level: EntityLevel): string {
  const info = LEVEL_LABELS[level];
  return info ? `${info.article} ${info.singular}` : level;
}

// ==================== MESSAGES D'ERREUR DE BASE ====================

/**
 * Messages pour les erreurs de format de date
 */
export const FORMAT_ERROR_MESSAGES = {
  INVALID_DATE: 'Date invalide. Utilisez le format JJ/MM/AAAA',
  INVALID_START_DATE: 'Date de début invalide',
  INVALID_END_DATE: 'Date de fin invalide',
  INVALID_TAG_START_DATE: 'Date de début des tags invalide',
  INVALID_TAG_END_DATE: 'Date de fin des tags invalide'
} as const;

/**
 * Messages pour les erreurs de cohérence interne
 */
export const COHERENCE_ERROR_MESSAGES = {
  END_BEFORE_START: (startDate: string, endDate: string) => 
    `La date de fin (${formatDateForDisplay(endDate)}) doit être postérieure ou égale à la date de début (${formatDateForDisplay(startDate)})`,
  
  TAG_END_BEFORE_START: (tagStartDate: string, tagEndDate: string) =>
    `La date de fin des tags (${formatDateForDisplay(tagEndDate)}) doit être postérieure ou égale à la date de début des tags (${formatDateForDisplay(tagStartDate)})`
} as const;

// ==================== MESSAGES D'ERREUR HIÉRARCHIQUE ====================

/**
 * Messages pour les violations de hiérarchie (enfant vs parent)
 */
export const HIERARCHY_ERROR_MESSAGES = {
  START_BEFORE_PARENT_START: (
    currentLevel: EntityLevel,
    currentDate: string,
    parentLevel: EntityLevel,
    parentDate: string
  ) => 
    `La date de début du ${getLevelLabel(currentLevel)} (${formatDateForDisplay(currentDate)}) ne peut pas être antérieure à celle de ${getLevelWithArticle(parentLevel)} (${formatDateForDisplay(parentDate)})`,

  START_AFTER_PARENT_END: (
    currentLevel: EntityLevel,
    currentDate: string,
    parentLevel: EntityLevel,
    parentDate: string
  ) =>
    `La date de début du ${getLevelLabel(currentLevel)} (${formatDateForDisplay(currentDate)}) ne peut pas être postérieure à la fin de ${getLevelWithArticle(parentLevel)} (${formatDateForDisplay(parentDate)})`,

  END_AFTER_PARENT_END: (
    currentLevel: EntityLevel,
    currentDate: string,
    parentLevel: EntityLevel,
    parentDate: string
  ) =>
    `La date de fin du ${getLevelLabel(currentLevel)} (${formatDateForDisplay(currentDate)}) ne peut pas être postérieure à celle de ${getLevelWithArticle(parentLevel)} (${formatDateForDisplay(parentDate)})`,

  END_BEFORE_PARENT_START: (
    currentLevel: EntityLevel,
    currentDate: string,
    parentLevel: EntityLevel,
    parentDate: string
  ) =>
    `La date de fin du ${getLevelLabel(currentLevel)} (${formatDateForDisplay(currentDate)}) ne peut pas être antérieure au début de ${getLevelWithArticle(parentLevel)} (${formatDateForDisplay(parentDate)})`
} as const;

// ==================== MESSAGES D'ERREUR POUR LES TAGS ====================

/**
 * Messages pour les erreurs de dates de tags
 */
export const TAG_ERROR_MESSAGES = {
  TAG_START_AFTER_MAIN_START: (currentLevel: EntityLevel, tagDate: string, mainDate: string) =>
    `Les tags doivent commencer avant ou en même temps que ${getLevelLabel(currentLevel)} (${formatDateForDisplay(mainDate)}). Date actuelle des tags : ${formatDateForDisplay(tagDate)}`,

  TAG_END_BEFORE_MAIN_END: (currentLevel: EntityLevel, tagDate: string, mainDate: string) =>
    `Les tags doivent finir après ou en même temps que ${getLevelLabel(currentLevel)} (${formatDateForDisplay(mainDate)}). Date actuelle des tags : ${formatDateForDisplay(tagDate)}`,

  CREATIVE_TAG_START_BEFORE_PLACEMENT: (creativeTagDate: string, placementTagDate: string) =>
    `Les tags du créatif ne peuvent pas commencer avant les tags du placement (${formatDateForDisplay(placementTagDate)}). Date actuelle : ${formatDateForDisplay(creativeTagDate)}`,

  CREATIVE_TAG_END_AFTER_PLACEMENT: (creativeTagDate: string, placementTagDate: string) =>
    `Les tags du créatif ne peuvent pas finir après les tags du placement (${formatDateForDisplay(placementTagDate)}). Date actuelle : ${formatDateForDisplay(creativeTagDate)}`
} as const;

// ==================== MESSAGES D'AIDE ET D'INFORMATION ====================

/**
 * Messages d'aide pour expliquer les limites
 */
export const HELP_MESSAGES = {
  DATE_LIMITS_INFO: (parentLevel: EntityLevel, startDate: string, endDate: string) =>
    `Les dates doivent être comprises entre ${formatDateForDisplay(startDate)} et ${formatDateForDisplay(endDate)} (limites de ${getLevelWithArticle(parentLevel)})`,

  TAG_DATES_INFO: (entityLevel: EntityLevel) =>
    `Les dates de tags doivent encadrer les dates du ${getLevelLabel(entityLevel)} (commencer avant et finir après)`,

  NO_PARENT_DATES: (parentLevel: EntityLevel) =>
    `Aucune limite : ${getLevelWithArticle(parentLevel)} n'a pas de dates définies`,

  INHERITED_FROM: (sourceLevel: EntityLevel) =>
    `Limites héritées de ${getLevelWithArticle(sourceLevel)}`
} as const;

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
  DATES_VALID: 'Toutes les dates sont valides',
  DATES_WITHIN_LIMITS: 'Les dates respectent les limites hiérarchiques',
  TAG_DATES_VALID: 'Les dates de tags sont correctement configurées'
} as const;

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Génère un message d'erreur basé sur le code d'erreur et les paramètres
 */
export function getErrorMessage(
  errorCode: string,
  options: ValidationMessageOptions
): string {
  const {
    date,
    startDate,
    endDate,
    parentLevel,
    parentStartDate,
    parentEndDate,
    currentLevel,
    limits
  } = options;

  switch (errorCode) {
    case 'INVALID_DATE':
      return FORMAT_ERROR_MESSAGES.INVALID_DATE;
    
    case 'INVALID_START_DATE':
      return FORMAT_ERROR_MESSAGES.INVALID_START_DATE;
    
    case 'INVALID_END_DATE':
      return FORMAT_ERROR_MESSAGES.INVALID_END_DATE;
    
    case 'INVALID_TAG_START_DATE':
      return FORMAT_ERROR_MESSAGES.INVALID_TAG_START_DATE;
    
    case 'INVALID_TAG_END_DATE':
      return FORMAT_ERROR_MESSAGES.INVALID_TAG_END_DATE;
    
    case 'END_BEFORE_START':
      if (startDate && endDate) {
        return COHERENCE_ERROR_MESSAGES.END_BEFORE_START(startDate, endDate);
      }
      break;
    
    case 'TAG_END_BEFORE_START':
      if (startDate && endDate) {
        return COHERENCE_ERROR_MESSAGES.TAG_END_BEFORE_START(startDate, endDate);
      }
      break;
    
    case 'START_BEFORE_PARENT_START':
      if (currentLevel && date && parentLevel && parentStartDate) {
        return HIERARCHY_ERROR_MESSAGES.START_BEFORE_PARENT_START(
          currentLevel, date, parentLevel, parentStartDate
        );
      }
      break;
    
    case 'START_AFTER_PARENT_END':
      if (currentLevel && date && parentLevel && parentEndDate) {
        return HIERARCHY_ERROR_MESSAGES.START_AFTER_PARENT_END(
          currentLevel, date, parentLevel, parentEndDate
        );
      }
      break;
    
    case 'END_AFTER_PARENT_END':
      if (currentLevel && date && parentLevel && parentEndDate) {
        return HIERARCHY_ERROR_MESSAGES.END_AFTER_PARENT_END(
          currentLevel, date, parentLevel, parentEndDate
        );
      }
      break;
    
    case 'END_BEFORE_PARENT_START':
      if (currentLevel && date && parentLevel && parentStartDate) {
        return HIERARCHY_ERROR_MESSAGES.END_BEFORE_PARENT_START(
          currentLevel, date, parentLevel, parentStartDate
        );
      }
      break;
    
    case 'TAG_START_AFTER_MAIN_START':
      if (currentLevel && date && startDate) {
        return TAG_ERROR_MESSAGES.TAG_START_AFTER_MAIN_START(currentLevel, date, startDate);
      }
      break;
    
    case 'TAG_END_BEFORE_MAIN_END':
      if (currentLevel && date && endDate) {
        return TAG_ERROR_MESSAGES.TAG_END_BEFORE_MAIN_END(currentLevel, date, endDate);
      }
      break;
    
    case 'CREATIVE_TAG_START_BEFORE_PLACEMENT':
      if (date && parentStartDate) {
        return TAG_ERROR_MESSAGES.CREATIVE_TAG_START_BEFORE_PLACEMENT(date, parentStartDate);
      }
      break;
    
    case 'CREATIVE_TAG_END_AFTER_PLACEMENT':
      if (date && parentEndDate) {
        return TAG_ERROR_MESSAGES.CREATIVE_TAG_END_AFTER_PLACEMENT(date, parentEndDate);
      }
      break;
    
    default:
      return `Erreur de validation : ${errorCode}`;
  }
  
  return `Erreur de validation : paramètres manquants pour ${errorCode}`;
}

/**
 * Génère un message d'aide sur les limites de dates
 */
export function getDateLimitsHelpMessage(limits: DateLimits): string | null {
  if (!limits.minStartDate || !limits.maxEndDate || !limits.sourceLevel) {
    return null;
  }
  
  return HELP_MESSAGES.DATE_LIMITS_INFO(
    limits.sourceLevel,
    limits.minStartDate,
    limits.maxEndDate
  );
}

/**
 * Génère un message d'information sur l'héritage des limites
 */
export function getInheritanceInfoMessage(sourceLevel: EntityLevel): string {
  return HELP_MESSAGES.INHERITED_FROM(sourceLevel);
}

/**
 * Génère un message d'aide pour les dates de tags
 */
export function getTagDatesHelpMessage(entityLevel: EntityLevel): string {
  return HELP_MESSAGES.TAG_DATES_INFO(entityLevel);
}

// ==================== TEMPLATES DE MESSAGES COMPLETS ====================

/**
 * Template pour afficher une validation complète avec aide
 */
export function formatValidationMessage(
  errorMessage: string,
  limits?: DateLimits,
  includeHelp: boolean = true
): string {
  let message = errorMessage;
  
  if (includeHelp && limits) {
    const helpMessage = getDateLimitsHelpMessage(limits);
    if (helpMessage) {
      message += `\n\nInformation : ${helpMessage}`;
    }
  }
  
  return message;
}