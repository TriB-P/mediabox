// app/lib/dateUtils.ts

/**
 * Utilitaires standardisés pour la manipulation des dates dans l'application
 * Centralise toutes les opérations courantes sur les dates
 */

// ==================== VALIDATION ET FORMATAGE ====================

/**
 * Vérifie si une chaîne représente une date valide au format ISO (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string | undefined | null): boolean {
    if (!dateString || typeof dateString !== 'string') return false;
    
    // Vérifier le format YYYY-MM-DD
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(dateString)) return false;
    
    // Vérifier que c'est une date valide
    const date = new Date(dateString + 'T00:00:00.000Z'); // Force UTC pour éviter problèmes fuseau
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString;
  }
  
  /**
   * Convertit une Date JavaScript en string ISO (YYYY-MM-DD)
   */
  export function dateToISOString(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      return isValidDateString(date) ? date : '';
    }
    
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
    
    return '';
  }
  
  /**
   * Convertit un string ISO en Date JavaScript
   */
  export function isoStringToDate(dateString: string | null | undefined): Date | null {
    if (!isValidDateString(dateString)) return null;
    return new Date(dateString + 'T00:00:00.000Z');
  }
  
  /**
   * Formate une date pour l'affichage utilisateur
   */
  export function formatDateForDisplay(dateString: string | null | undefined, locale: string = 'fr-CA'): string {
    if (!isValidDateString(dateString)) return '';
    
    const date = isoStringToDate(dateString);
    if (!date) return '';
    
    return date.toLocaleDateString(locale);
  }
  
  /**
   * Formate une date pour l'affichage dans un input HTML date
   */
  export function formatDateForInput(date: Date | string | null | undefined): string {
    return dateToISOString(date);
  }
  
  // ==================== COMPARAISON ET CALCULS ====================
  
  /**
   * Compare deux dates. Retourne -1 si date1 < date2, 0 si égales, 1 si date1 > date2
   */
  export function compareDates(date1: string | null | undefined, date2: string | null | undefined): number {
    if (!isValidDateString(date1) || !isValidDateString(date2)) return 0;
    
    const d1 = new Date(date1!);
    const d2 = new Date(date2!);
    
    if (d1.getTime() < d2.getTime()) return -1;
    if (d1.getTime() > d2.getTime()) return 1;
    return 0;
  }
  
  /**
   * Vérifie si date1 est antérieure à date2
   */
  export function isBefore(date1: string | null | undefined, date2: string | null | undefined): boolean {
    return compareDates(date1, date2) < 0;
  }
  
  /**
   * Vérifie si date1 est postérieure à date2
   */
  export function isAfter(date1: string | null | undefined, date2: string | null | undefined): boolean {
    return compareDates(date1, date2) > 0;
  }
  
  /**
   * Vérifie si deux dates sont identiques
   */
  export function isSameDate(date1: string | null | undefined, date2: string | null | undefined): boolean {
    return compareDates(date1, date2) === 0;
  }
  
  /**
   * Vérifie si date1 est antérieure ou égale à date2
   */
  export function isBeforeOrEqual(date1: string | null | undefined, date2: string | null | undefined): boolean {
    const comparison = compareDates(date1, date2);
    return comparison <= 0;
  }
  
  /**
   * Vérifie si date1 est postérieure ou égale à date2
   */
  export function isAfterOrEqual(date1: string | null | undefined, date2: string | null | undefined): boolean {
    const comparison = compareDates(date1, date2);
    return comparison >= 0;
  }
  
  /**
   * Calcule le nombre de jours entre deux dates
   */
  export function daysBetween(startDate: string | null | undefined, endDate: string | null | undefined): number {
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) return 0;
    
    const d1 = new Date(startDate!);
    const d2 = new Date(endDate!);
    const diffTime = d2.getTime() - d1.getTime();
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // ==================== MANIPULATION DE DATES ====================
  
  /**
   * Ajoute un nombre de jours à une date
   */
  export function addDays(dateString: string | null | undefined, days: number): string {
    if (!isValidDateString(dateString)) return '';
    
    const date = new Date(dateString!);
    date.setDate(date.getDate() + days);
    
    return dateToISOString(date);
  }
  
  /**
   * Soustrait un nombre de jours à une date
   */
  export function subtractDays(dateString: string | null | undefined, days: number): string {
    return addDays(dateString, -days);
  }
  
  /**
   * Retourne la date la plus ancienne entre deux dates
   */
  export function minDate(date1: string | null | undefined, date2: string | null | undefined): string | null {
    if (!isValidDateString(date1) && !isValidDateString(date2)) return null;
    if (!isValidDateString(date1)) return date2!;
    if (!isValidDateString(date2)) return date1!;
    
    return isBefore(date1, date2) ? date1! : date2!;
  }
  
  /**
   * Retourne la date la plus récente entre deux dates
   */
  export function maxDate(date1: string | null | undefined, date2: string | null | undefined): string | null {
    if (!isValidDateString(date1) && !isValidDateString(date2)) return null;
    if (!isValidDateString(date1)) return date2!;
    if (!isValidDateString(date2)) return date1!;
    
    return isAfter(date1, date2) ? date1! : date2!;
  }
  
  // ==================== FORMATAGE SPÉCIALISÉ ====================
  
  /**
   * Formate une date au format MMMdd pour les Sprint Dates
   * (ex: "Jan15", "Feb28")
   */
  export function formatDateToMMMdd(dateString: string | null | undefined): string {
    if (!isValidDateString(dateString)) return '';
    
    try {
      const date = new Date(dateString! + 'T00:00:00.000Z');
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const monthName = monthNames[date.getUTCMonth()];
      const day = date.getUTCDate().toString().padStart(2, '0');
      
      return `${monthName}${day}`;
    } catch (error) {
      console.error('Erreur lors du formatage de la date en MMMdd:', error);
      return '';
    }
  }
  
  /**
   * Calcule les Sprint Dates au format "MMMdd-MMMdd"
   */
  export function calculateSprintDates(startDate: string | null | undefined, endDate: string | null | undefined): string {
    const startFormatted = formatDateToMMMdd(startDate);
    const endFormatted = formatDateToMMMdd(endDate);
    
    if (startFormatted && endFormatted) {
      return `${startFormatted}-${endFormatted}`;
    }
    return '';
  }
  
  // ==================== UTILITAIRES POUR FORMULAIRES ====================
  
  /**
   * Génère les contraintes min/max pour un input date HTML
   */
  export function getDateInputConstraints(minDate?: string, maxDate?: string): {
    min?: string;
    max?: string;
  } {
    const constraints: { min?: string; max?: string } = {};
    
    if (isValidDateString(minDate)) {
      constraints.min = minDate!;
    }
    
    if (isValidDateString(maxDate)) {
      constraints.max = maxDate!;
    }
    
    return constraints;
  }
  
  /**
   * Vérifie si une date est dans une plage donnée
   */
  export function isDateInRange(
    date: string | null | undefined,
    minDate?: string | null,
    maxDate?: string | null
  ): boolean {
    if (!isValidDateString(date)) return false;
    
    if (minDate && isValidDateString(minDate) && isBefore(date, minDate)) {
      return false;
    }
    
    if (maxDate && isValidDateString(maxDate) && isAfter(date, maxDate)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Nettoie une date (retourne null si invalide, string ISO sinon)
   */
  export function cleanDateString(date: string | Date | null | undefined): string | null {
    if (!date) return null;
    
    const isoString = dateToISOString(date);
    return isoString || null;
  }
  
  // ==================== CONSTANTES UTILES ====================
  
  export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DD',
    DISPLAY_FR: 'DD/MM/YYYY', 
    DISPLAY_EN: 'MM/DD/YYYY',
    SPRINT: 'MMMdd-MMMdd'
  } as const;
  
  export const DATE_REGEX = {
    ISO: /^\d{4}-\d{2}-\d{2}$/,
    SPRINT: /^[A-Za-z]{3}\d{2}-[A-Za-z]{3}\d{2}$/
  } as const;