// app/utils/numberFormatting.ts

/**
 * Utilitaire pour formater les nombres selon la locale du template Google Sheets.
 * Résout le problème où les nombres avec "." sont traités comme du texte 
 * dans les templates français qui attendent des "," comme séparateur décimal.
 */

/**
 * Formate un nombre selon la locale spécifiée.
 * @param value La valeur à formater (string ou number)
 * @param locale La locale ('FR' ou 'EN')
 * @returns Le nombre formaté selon la locale ou la valeur originale si ce n'est pas un nombre
 */
export function formatNumberForLocale(value: any, locale: 'FR' | 'EN'): string | number {
    // Si ce n'est pas une valeur numérique, retourner tel quel
    if (value === null || value === undefined || value === '') {
      return value;
    }
  
    // Convertir en string pour traitement
    const stringValue = String(value).trim();
    
    // Vérifier si c'est un nombre (avec point décimal)
    const numericValue = Number(stringValue);
    
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      // Ce n'est pas un nombre valide, retourner tel quel
      return value;
    }
  
    // Si la locale est française, convertir le point en virgule pour les décimales
    if (locale === 'FR') {
      // Utiliser toLocaleString avec la locale française
      return numericValue.toLocaleString('fr-FR');
    } else {
      // Pour l'anglais, garder le format avec point
      return numericValue.toLocaleString('en-US');
    }
  }
  
  /**
   * Formate récursivement un tableau 2D de données selon la locale.
   * @param data Le tableau 2D à formater
   * @param locale La locale ('FR' ou 'EN')
   * @returns Le tableau formaté
   */
  export function formatDataArrayForLocale(
    data: (string | number)[][],
    locale: 'FR' | 'EN'
  ): (string | number)[][] {
    return data.map(row => 
      row.map(cell => formatNumberForLocale(cell, locale))
    );
  }
  
  /**
   * Détermine la locale à partir de la langue du template.
   * @param templateLanguage La langue du template (ex: 'Français', 'Anglais')
   * @returns La locale correspondante ('FR' ou 'EN')
   */
  export function getLocaleFromTemplateLanguage(templateLanguage: string): 'FR' | 'EN' {
    const language = templateLanguage.toLowerCase();
    
    if (language.includes('français') || language.includes('french') || language === 'fr') {
      return 'FR';
    }
    
    // Par défaut, anglais
    return 'EN';
  }
  
  /**
   * Alternative : Force l'utilisation de nombres purs avec valueInputOption=USER_ENTERED
   * Cette approche laisse Google Sheets interpréter automatiquement selon sa locale.
   * @param data Le tableau 2D à nettoyer
   * @returns Le tableau avec des nombres purs (pas de formatage locale)
   */
  export function prepareDataForUserEntered(data: (string | number)[][]): (string | number)[][] {
    return data.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined || cell === '') {
          return cell;
        }
  
        const stringValue = String(cell).trim();
        const numericValue = Number(stringValue);
        
        if (!isNaN(numericValue) && isFinite(numericValue)) {
          // Retourner le nombre pur, Google Sheets gérera la locale
          return numericValue;
        }
        
        return cell;
      })
    );
  }