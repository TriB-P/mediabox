/**
 * Ce hook personnalisé gère la pagination et le filtrage des données.
 * Il prend en charge la recherche, le changement de taille de page,
 * et la navigation entre les pages.
 */
import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  pageSize: number;
  searchQuery?: string;
  searchFilter?: (item: T, query: string) => boolean;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  filteredData: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Hook de pagination pour filtrer et paginer des données.
 * @param {UsePaginationProps<T>} props - Les propriétés du hook de pagination.
 * @param {T[]} props.data - Les données brutes à paginer.
 * @param {number} props.pageSize - La taille initiale de la page.
 * @param {string} [props.searchQuery] - La chaîne de caractères pour la recherche.
 * @param {(item: T, query: string) => boolean} [props.searchFilter] - La fonction de filtre pour la recherche.
 * @returns {UsePaginationReturn<T>} Un objet contenant l'état de la pagination et les fonctions de manipulation.
 */
export function usePagination<T>({
  data,
  pageSize: initialPageSize,
  searchQuery = '',
  searchFilter
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const filteredData = useMemo(() => {
    if (!searchQuery || !searchFilter) return data;
    return data.filter(item => searchFilter(item, searchQuery));
  }, [data, searchQuery, searchFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  /**
   * Navigue vers une page spécifique.
   * @param {number} page - Le numéro de la page cible.
   * @returns {void}
   */
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  /**
   * Passe à la page suivante si elle existe.
   * @returns {void}
   */
  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  /**
   * Passe à la page précédente si elle existe.
   * @returns {void}
   */
  const previousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  /**
   * Définit une nouvelle taille de page et ajuste la page actuelle en conséquence.
   * @param {number} size - La nouvelle taille de page.
   * @returns {void}
   */
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    const currentFirstItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentFirstItemIndex / size) + 1;
    setCurrentPage(newPage);
  };

  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, data.length]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    filteredData,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    pageSize,
    totalItems,
    startIndex: startIndex + 1,
    endIndex
  };
}