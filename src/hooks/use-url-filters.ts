
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface URLFilters {
  semanticSearch: string;
  selectedStatus: string | null;
}

export const useURLFilters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [filters, setFilters] = useState<URLFilters>({
    semanticSearch: '',
    selectedStatus: null
  });

  // Read filters from URL on mount and location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const semanticSearch = searchParams.get('search') || '';
    const selectedStatus = searchParams.get('status') || null;
    
    setFilters({
      semanticSearch,
      selectedStatus
    });
  }, [location.search]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: Partial<URLFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    const searchParams = new URLSearchParams();
    
    // Only add non-empty parameters
    if (updatedFilters.semanticSearch.trim()) {
      searchParams.set('search', updatedFilters.semanticSearch);
    }
    if (updatedFilters.selectedStatus) {
      searchParams.set('status', updatedFilters.selectedStatus);
    }
    
    // Update URL without causing a full page reload
    const newSearch = searchParams.toString();
    const newPath = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    
    navigate(newPath, { replace: true });
  }, [filters, location.pathname, navigate]);

  const updateSemanticSearch = useCallback((search: string) => {
    updateURL({ semanticSearch: search });
  }, [updateURL]);

  const updateSelectedStatus = useCallback((status: string | null) => {
    updateURL({ selectedStatus: status });
  }, [updateURL]);

  const clearFilters = useCallback(() => {
    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname]);

  const hasActiveFilters = filters.semanticSearch.trim() || filters.selectedStatus;

  return {
    filters,
    updateSemanticSearch,
    updateSelectedStatus,
    clearFilters,
    hasActiveFilters
  };
};
