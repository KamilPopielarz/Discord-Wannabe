import React from 'react';
import { Button } from '../ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  RefreshCw 
} from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  loading?: boolean;
  totalPages?: number;
}

export function PaginationControls({ 
  currentPage, 
  hasNextPage, 
  onPageChange, 
  onRefresh,
  loading,
  totalPages 
}: PaginationControlsProps) {
  const hasPreviousPage = currentPage > 1;

  const goToFirstPage = () => {
    if (hasPreviousPage && !loading) {
      onPageChange(1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const goToLastPage = () => {
    if (totalPages && hasNextPage && !loading) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Odśwież
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-sm text-muted-foreground">
          Strona {currentPage}
          {totalPages && ` z ${totalPages}`}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={!hasPreviousPage || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={!hasPreviousPage || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!hasNextPage || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {totalPages && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={!hasNextPage || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
