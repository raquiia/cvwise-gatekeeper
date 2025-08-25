import { useState, useMemo } from 'react';

export interface PaginationConfig {
  itemsPerPage: number;
  currentPage: number;
  totalItems: number;
}

export interface PaginationControls {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setItemsPerPage: (items: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const usePagination = (
  totalItems: number,
  initialItemsPerPage: number = 20
): PaginationControls => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [totalItems, itemsPerPage, currentPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  };

  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSetItemsPerPage = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return {
    currentPage,
    totalPages: paginationData.totalPages,
    itemsPerPage,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setItemsPerPage: handleSetItemsPerPage,
    hasNextPage: paginationData.hasNextPage,
    hasPreviousPage: paginationData.hasPreviousPage,
  };
};