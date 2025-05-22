// app/hooks/usePagination.ts

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

export function usePagination<T>({
  data,
  pageSize: initialPageSize,
  searchQuery = '',
  searchFilter
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Filtrer les données selon la recherche
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchFilter) return data;
    return data.filter(item => searchFilter(item, searchQuery));
  }, [data, searchQuery, searchFilter]);

  // Calculer la pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Données paginées
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  // Navigation
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    // Recalculer la page actuelle pour garder approximativement la même position
    const currentFirstItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentFirstItemIndex / size) + 1;
    setCurrentPage(newPage);
  };

  // Réinitialiser à la page 1 quand les données ou la recherche changent
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
    startIndex: startIndex + 1, // +1 pour l'affichage (commence à 1 au lieu de 0)
    endIndex
  };
}