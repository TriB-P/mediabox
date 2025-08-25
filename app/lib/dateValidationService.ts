// app/lib/dateValidationService.ts

/**
 * Service centralisé pour la validation des dates dans la hiérarchie Campaign > Tactique > Placement > Créatif
 * Gère la remontée automatique dans la hiérarchie et la validation des dates de tags
 */

// ==================== INTERFACES ====================

export interface DateRange {
    startDate?: string;
    endDate?: string;
  }
  
  export interface DateHierarchy {
    campaign?: DateRange;
    tactique?: DateRange;
    placement?: DateRange;
    creatif?: DateRange;
  }
  
  export interface TagDates {
    tagStartDate?: string;
    tagEndDate?: string;
  }
  
  export interface DateLimits {
    minStartDate?: string;
    maxStartDate?: string;
    minEndDate?: string;
    maxEndDate?: string;
    sourceLevel?: 'campaign' | 'tactique' | 'placement' | 'creatif';
  }
  
  export interface ValidationError {
    field: string;
    message: string;
    code: string;
    limits?: DateLimits;
  }
  
  export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    limits: DateLimits;
  }
  
  export type EntityLevel = 'campaign' | 'tactique' | 'placement' | 'creatif';
  
  // ==================== UTILITAIRES DE BASE ====================
  
  /**
   * Vérifie si une date est valide
   */
  function isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  }
  
  /**
   * Compare deux dates. Retourne -1 si date1 < date2, 0 si égales, 1 si date1 > date2
   */
  function compareDates(date1: string, date2: string): number {
    if (!isValidDate(date1) || !isValidDate(date2)) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1 < d2 ? -1 : d1 > d2 ? 1 : 0;
  }
  
  /**
   * Formate une date pour l'affichage (YYYY-MM-DD -> DD/MM/YYYY)
   */
  function formatDateForDisplay(dateString: string): string {
    if (!isValidDate(dateString)) return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA');
  }
  
  // ==================== LOGIQUE DE REMONTÉE HIÉRARCHIQUE ====================
  
  /**
   * Trouve les limites de dates en remontant dans la hiérarchie
   * Remonte automatiquement si le parent direct n'a pas de dates
   */
  export function getParentDateLimits(
    targetLevel: EntityLevel,
    hierarchy: DateHierarchy
  ): DateLimits {
    const levels: EntityLevel[] = ['campaign', 'tactique', 'placement', 'creatif'];
    const targetIndex = levels.indexOf(targetLevel);
    
    // Remonter dans la hiérarchie pour trouver des dates valides
    for (let i = targetIndex - 1; i >= 0; i--) {
      const level = levels[i];
      const levelData = hierarchy[level];
      
      if (levelData?.startDate && levelData?.endDate && 
          isValidDate(levelData.startDate) && isValidDate(levelData.endDate)) {
        
        return {
          minStartDate: levelData.startDate,
          maxStartDate: levelData.endDate,
          minEndDate: levelData.startDate,
          maxEndDate: levelData.endDate,
          sourceLevel: level
        };
      }
    }
    
    return {}; // Aucune limite trouvée
  }
  
  // ==================== VALIDATION DES DATES PRINCIPALES ====================
  
  /**
   * Valide qu'une plage de dates est cohérente (fin >= début)
   */
  export function validateDateRange(
    startDate: string | undefined,
    endDate: string | undefined,
    fieldPrefix: string = ''
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Si aucune date n'est fournie, pas d'erreur (dates optionnelles)
    if (!startDate && !endDate) return errors;
    
    // Validation des formats
    if (startDate && !isValidDate(startDate)) {
      errors.push({
        field: `${fieldPrefix}startDate`,
        message: `Date de début invalide`,
        code: 'INVALID_START_DATE'
      });
    }
    
    if (endDate && !isValidDate(endDate)) {
      errors.push({
        field: `${fieldPrefix}endDate`,
        message: `Date de fin invalide`,
        code: 'INVALID_END_DATE'
      });
    }
    
    // Si les formats sont valides, vérifier la cohérence
    if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
      if (compareDates(startDate, endDate) > 0) {
        errors.push({
          field: `${fieldPrefix}endDate`,
          message: `La date de fin (${formatDateForDisplay(endDate)}) doit être postérieure ou égale à la date de début (${formatDateForDisplay(startDate)})`,
          code: 'END_BEFORE_START'
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Valide les dates d'une entité par rapport à sa hiérarchie parente
   */
  export function validateHierarchicalDates(
    entityLevel: EntityLevel,
    entityDates: DateRange,
    hierarchy: DateHierarchy
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const limits = getParentDateLimits(entityLevel, hierarchy);
    
    // D'abord valider la cohérence interne
    const rangeErrors = validateDateRange(
      entityDates.startDate,
      entityDates.endDate,
      `${entityLevel}_`
    );
    errors.push(...rangeErrors);
    
    // Si pas de limites parentes ou pas de dates entité, retourner
    if (!limits.minStartDate || !limits.maxEndDate || 
        (!entityDates.startDate && !entityDates.endDate)) {
      return { isValid: errors.length === 0, errors, limits };
    }
    
    const { startDate, endDate } = entityDates;
    const levelLabels = {
      campaign: 'campagne',
      tactique: 'tactique', 
      placement: 'placement',
      creatif: 'créatif'
    };
    
    // Validation date de début
    if (startDate && isValidDate(startDate)) {
      if (compareDates(startDate, limits.minStartDate!) < 0) {
        errors.push({
          field: `${entityLevel}_startDate`,
          message: `La date de début du ${levelLabels[entityLevel]} (${formatDateForDisplay(startDate)}) ne peut pas être antérieure à celle de la ${levelLabels[limits.sourceLevel!]} (${formatDateForDisplay(limits.minStartDate!)})`,
          code: 'START_BEFORE_PARENT_START',
          limits
        });
      }
      
      if (compareDates(startDate, limits.maxEndDate!) > 0) {
        errors.push({
          field: `${entityLevel}_startDate`,
          message: `La date de début du ${levelLabels[entityLevel]} (${formatDateForDisplay(startDate)}) ne peut pas être postérieure à la fin de la ${levelLabels[limits.sourceLevel!]} (${formatDateForDisplay(limits.maxEndDate!)})`,
          code: 'START_AFTER_PARENT_END',
          limits
        });
      }
    }
    
    // Validation date de fin
    if (endDate && isValidDate(endDate)) {
      if (compareDates(endDate, limits.maxEndDate!) > 0) {
        errors.push({
          field: `${entityLevel}_endDate`,
          message: `La date de fin du ${levelLabels[entityLevel]} (${formatDateForDisplay(endDate)}) ne peut pas être postérieure à celle de la ${levelLabels[limits.sourceLevel!]} (${formatDateForDisplay(limits.maxEndDate!)})`,
          code: 'END_AFTER_PARENT_END',
          limits
        });
      }
      
      if (compareDates(endDate, limits.minStartDate!) < 0) {
        errors.push({
          field: `${entityLevel}_endDate`,
          message: `La date de fin du ${levelLabels[entityLevel]} (${formatDateForDisplay(endDate)}) ne peut pas être antérieure au début de la ${levelLabels[limits.sourceLevel!]} (${formatDateForDisplay(limits.minStartDate!)})`,
          code: 'END_BEFORE_PARENT_START',
          limits
        });
      }
    }
    
    return { isValid: errors.length === 0, errors, limits };
  }
  
  // ==================== VALIDATION DES DATES DE TAGS ====================
  
  /**
   * Valide les dates de tags (doivent être plus larges que les dates principales)
   */
  export function validateTagDates(
    entityLevel: EntityLevel,
    mainDates: DateRange,
    tagDates: TagDates,
    parentTagDates?: TagDates
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const limits: DateLimits = {};
    
    const { startDate: mainStart, endDate: mainEnd } = mainDates;
    const { tagStartDate, tagEndDate } = tagDates;
    
    const levelLabels = {
      campaign: 'campagne',
      tactique: 'tactique',
      placement: 'placement', 
      creatif: 'créatif'
    };
    
    // Validation des formats
    if (tagStartDate && !isValidDate(tagStartDate)) {
      errors.push({
        field: `${entityLevel}_tagStartDate`,
        message: 'Date de début des tags invalide',
        code: 'INVALID_TAG_START_DATE'
      });
    }
    
    if (tagEndDate && !isValidDate(tagEndDate)) {
      errors.push({
        field: `${entityLevel}_tagEndDate`,
        message: 'Date de fin des tags invalide',
        code: 'INVALID_TAG_END_DATE'
      });
    }
    
    // Validation cohérence interne des tags
    if (tagStartDate && tagEndDate && isValidDate(tagStartDate) && isValidDate(tagEndDate)) {
      if (compareDates(tagStartDate, tagEndDate) > 0) {
        errors.push({
          field: `${entityLevel}_tagEndDate`,
          message: `La date de fin des tags (${formatDateForDisplay(tagEndDate)}) doit être postérieure à la date de début (${formatDateForDisplay(tagStartDate)})`,
          code: 'TAG_END_BEFORE_START'
        });
      }
    }
    
    // Validation tags vs dates principales (tags doivent être plus larges)
    if (mainStart && tagStartDate && isValidDate(mainStart) && isValidDate(tagStartDate)) {
      if (compareDates(tagStartDate, mainStart) > 0) {
        errors.push({
          field: `${entityLevel}_tagStartDate`,
          message: `Les tags doivent commencer avant ou en même temps que le ${levelLabels[entityLevel]} (${formatDateForDisplay(mainStart)}). Date actuelle: ${formatDateForDisplay(tagStartDate)}`,
          code: 'TAG_START_AFTER_MAIN_START'
        });
      }
    }
    
    if (mainEnd && tagEndDate && isValidDate(mainEnd) && isValidDate(tagEndDate)) {
      if (compareDates(tagEndDate, mainEnd) < 0) {
        errors.push({
          field: `${entityLevel}_tagEndDate`,
          message: `Les tags doivent finir après ou en même temps que le ${levelLabels[entityLevel]} (${formatDateForDisplay(mainEnd)}). Date actuelle: ${formatDateForDisplay(tagEndDate)}`,
          code: 'TAG_END_BEFORE_MAIN_END'
        });
      }
    }
    
    // Validation tags créatifs vs tags placement parent
    if (entityLevel === 'creatif' && parentTagDates) {
      const { tagStartDate: parentTagStart, tagEndDate: parentTagEnd } = parentTagDates;
      
      if (tagStartDate && parentTagStart && isValidDate(tagStartDate) && isValidDate(parentTagStart)) {
        if (compareDates(tagStartDate, parentTagStart) < 0) {
          errors.push({
            field: 'creatif_tagStartDate',
            message: `Les tags du créatif ne peuvent pas commencer avant les tags du placement (${formatDateForDisplay(parentTagStart)}). Date actuelle: ${formatDateForDisplay(tagStartDate)}`,
            code: 'CREATIVE_TAG_START_BEFORE_PLACEMENT'
          });
        }
      }
      
      if (tagEndDate && parentTagEnd && isValidDate(tagEndDate) && isValidDate(parentTagEnd)) {
        if (compareDates(tagEndDate, parentTagEnd) > 0) {
          errors.push({
            field: 'creatif_tagEndDate',
            message: `Les tags du créatif ne peuvent pas finir après les tags du placement (${formatDateForDisplay(parentTagEnd)}). Date actuelle: ${formatDateForDisplay(tagEndDate)}`,
            code: 'CREATIVE_TAG_END_AFTER_PLACEMENT'
          });
        }
      }
    }
    
    return { isValid: errors.length === 0, errors, limits };
  }
  
  // ==================== FONCTIONS PRINCIPALES D'EXPORT ====================
  
  /**
   * Valide complètement les dates d'une entité (principales + tags)
   */
  export function validateEntityDates(
    entityLevel: EntityLevel,
    entityData: {
      startDate?: string;
      endDate?: string;
      tagStartDate?: string;
      tagEndDate?: string;
    },
    hierarchy: DateHierarchy,
    parentTagDates?: TagDates
  ): ValidationResult {
    const mainValidation = validateHierarchicalDates(
      entityLevel,
      { startDate: entityData.startDate, endDate: entityData.endDate },
      hierarchy
    );
    
    const tagValidation = validateTagDates(
      entityLevel,
      { startDate: entityData.startDate, endDate: entityData.endDate },
      { tagStartDate: entityData.tagStartDate, tagEndDate: entityData.tagEndDate },
      parentTagDates
    );
    
    return {
      isValid: mainValidation.isValid && tagValidation.isValid,
      errors: [...mainValidation.errors, ...tagValidation.errors],
      limits: mainValidation.limits
    };
  }
  
  /**
   * Construit la hiérarchie de dates à partir des données disponibles
   */
  export function buildDateHierarchy(data: {
    campaign?: DateRange;
    tactique?: DateRange; 
    placement?: DateRange;
    creatif?: DateRange;
  }): DateHierarchy {
    return {
      campaign: data.campaign,
      tactique: data.tactique,
      placement: data.placement,
      creatif: data.creatif
    };
  }
  
  /**
   * Utilitaire pour extraire les limites sous forme de contraintes pour les inputs HTML
   */
  export function getDateInputLimits(limits: DateLimits): {
    minDate?: string;
    maxDate?: string;
  } {
    return {
      minDate: limits.minStartDate,
      maxDate: limits.maxEndDate
    };
  }