// app/lib/partnerTypeService.ts

/**
 * Service de traduction des types de partenaires.
 * Gère la conversion entre les types anglais (stockés en DB) et les traductions françaises.
 */

/**
 * Mapping des types de partenaires anglais vers français
 */
const PARTNER_TYPE_TRANSLATIONS: { [key: string]: string } = {
    'Print Publisher': 'Partenaire imprimé',
    'Digital Publisher': 'Partenaire numérique', 
    'OOH Publisher': 'Partenaire OOH',
    'Programmatic Publisher': 'Partenaire programmatique',
    'Search Publisher': 'Partenaire moteur de recherche',
    'TV Station': 'Station TV',
    'Radio Station': 'Station radio',
    'Social Publisher': 'Partenaire social'
  };
  
  /**
   * Mapping inverse pour la recherche bidirectionnelle
   */
  const REVERSE_PARTNER_TYPE_TRANSLATIONS: { [key: string]: string } = {};
  Object.entries(PARTNER_TYPE_TRANSLATIONS).forEach(([english, french]) => {
    REVERSE_PARTNER_TYPE_TRANSLATIONS[french.toLowerCase()] = english;
  });
  
  /**
   * Traduit un type de partenaire de l'anglais vers le français
   * @param englishType Le type en anglais (tel que stocké en DB)
   * @param language La langue cible ('FR' ou 'EN')
   * @returns Le type traduit ou le type original si pas de traduction
   */
  export function translatePartnerType(englishType: string, language: 'fr' | 'en' = 'fr'): string {
    if (language === 'en' || !englishType) {
      return englishType;
    }
    
    return PARTNER_TYPE_TRANSLATIONS[englishType] || englishType;
  }
  
  /**
   * Obtient tous les types de partenaires disponibles dans la langue demandée
   * @param language La langue ('FR' ou 'EN')
   * @returns Array des types disponibles
   */
  export function getAllPartnerTypes(language: 'FR' | 'EN' = 'FR'): string[] {
    const englishTypes = Object.keys(PARTNER_TYPE_TRANSLATIONS);
    
    if (language === 'EN') {
      return englishTypes;
    }
    
    return englishTypes.map(type => PARTNER_TYPE_TRANSLATIONS[type]);
  }
  
  /**
   * Convertit un type français vers son équivalent anglais (pour le filtrage)
   * @param frenchType Le type en français
   * @returns Le type en anglais correspondant
   */
  export function getEnglishPartnerType(frenchType: string): string {
    return REVERSE_PARTNER_TYPE_TRANSLATIONS[frenchType.toLowerCase()] || frenchType;
  }
  
  /**
   * Vérifie si un type de partenaire correspond à un terme de recherche (bilingue)
   * @param partnerType Le type du partenaire (en anglais, tel que stocké)
   * @param searchTerm Le terme de recherche
   * @param language La langue de l'interface
   * @returns true si le type correspond au terme de recherche
   */
  export function matchesPartnerTypeSearch(
    partnerType: string, 
    searchTerm: string, 
    language: 'fr' | 'en' = 'fr'
  ): boolean {
    if (!partnerType || !searchTerm) return true;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Recherche dans le type anglais original
    if (partnerType.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }
    
    // Si l'interface est en français, recherche aussi dans la traduction française
    if (language === 'fr') {
      const frenchType = translatePartnerType(partnerType, 'fr');
      if (frenchType.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Crée un mapping des types uniques pour le filtrage avec leurs traductions
   * @param partners Array des partenaires
   * @param language Langue de l'interface
   * @returns Objet avec les types traduits comme clés et leur état actif
   */
  export function createPartnerTypeFilters(
    partners: Array<{ SH_Type?: string }>, 
    language: 'fr' | 'en' = 'fr'
  ): { [translatedType: string]: { englishType: string; active: boolean } } {
    const filters: { [translatedType: string]: { englishType: string; active: boolean } } = {};
    
    partners.forEach(partner => {
      if (partner.SH_Type && partner.SH_Type.trim() !== '') {
        const translatedType = translatePartnerType(partner.SH_Type, language);
        if (!filters[translatedType]) {
          filters[translatedType] = {
            englishType: partner.SH_Type,
            active: false
          };
        }
      }
    });
    
    return filters;
  }