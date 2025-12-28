import { useLocaleStore } from '../../stores';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
}

// SVG icons defined outside component to avoid recreation on each render
const ChevronLeftIcon = (
  <svg className="w-5 h-5 rtl-flip" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = (
  <svg className="w-5 h-5 rtl-flip" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  showInfo = true,
}: PaginationProps) {
  const { t } = useLocaleStore();

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
      {/* Info text */}
      {showInfo && (
        <p className="text-sm" style={{ color: 'var(--color-gray-600)' }}>
          {t('pagination.showing', 'Showing')} {' '}
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {startItem}
          </span>{' '}
          {t('pagination.to', 'to')}{' '}
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {endItem}
          </span>{' '}
          {t('pagination.of', 'of')}{' '}
          <span className="font-medium" style={{ color: 'var(--color-gray-900)' }}>
            {totalItems}
          </span>{' '}
          {t('pagination.results', 'results')}
        </p>
      )}

      {/* Page buttons */}
      <nav className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg transition-colors touch-target"
          style={{
            color: currentPage === 1 ? 'var(--color-gray-300)' : 'var(--color-gray-600)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          }}
          aria-label={t('pagination.previous', 'Previous page')}
        >
          {ChevronLeftIcon}
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2"
              style={{ color: 'var(--color-gray-400)' }}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className="min-w-[40px] h-10 rounded-lg font-medium transition-colors touch-target"
              style={{
                backgroundColor:
                  page === currentPage ? 'var(--color-primary-600)' : 'transparent',
                color:
                  page === currentPage ? 'white' : 'var(--color-gray-600)',
              }}
            >
              {page}
            </button>
          )
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg transition-colors touch-target"
          style={{
            color:
              currentPage === totalPages
                ? 'var(--color-gray-300)'
                : 'var(--color-gray-600)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          }}
          aria-label={t('pagination.next', 'Next page')}
        >
          {ChevronRightIcon}
        </button>
      </nav>
    </div>
  );
}
