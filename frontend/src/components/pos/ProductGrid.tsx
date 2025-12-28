/**
 * Product Grid Component for POS
 * Displays products in a grid with touch-friendly cards
 * Optimized for performance with caching and debounced search
 */

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useLocaleStore } from '../../stores';
import { SearchInput, LoadingSpinner } from '../ui';
import { ProductCard } from './ProductCard';
import { posApi, categoriesApi } from '../../lib/apiClient';
import type { POSProduct, Category } from '../../types';

interface ProductGridProps {
  onProductSelect: (product: POSProduct) => void;
}

export interface ProductGridHandle {
  refreshProducts: () => Promise<void>;
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const ProductGrid = forwardRef<ProductGridHandle, ProductGridProps>(({ onProductSelect }, ref) => {
  const { t, locale } = useLocaleStore();

  const [products, setProducts] = useState<POSProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  
  // Cache for products by category
  const productsCache = useRef<Map<string, { data: POSProduct[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 60000; // 1 minute client-side cache

  // Debounce search to avoid too many API calls (300ms delay)
  const debouncedSearch = useDebounce(search, 300);

  // Memoized currency formatter for performance
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-LY' : 'en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 3,
    });
    return (amount: number) => formatter.format(amount);
  }, [locale]);

  // Generate cache key
  const getCacheKey = useCallback((category?: number, searchTerm?: string) => {
    return `${category || 'all'}_${searchTerm || ''}`;
  }, []);

  // Load products with caching
  const loadProducts = useCallback(async (forceRefresh = false) => {
    const cacheKey = getCacheKey(selectedCategory, debouncedSearch);
    const cached = productsCache.current.get(cacheKey);
    
    // Use cache if valid and not forcing refresh (except for searches)
    if (!forceRefresh && cached && !debouncedSearch && Date.now() - cached.timestamp < CACHE_TTL) {
      setProducts(cached.data);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await posApi.products({
        search: debouncedSearch || undefined,
        category_id: selectedCategory,
      });
      setProducts(data);
      
      // Cache the results (don't cache search results as they change frequently)
      if (!debouncedSearch) {
        productsCache.current.set(cacheKey, { data, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Failed to load POS products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, getCacheKey]);

  // Expose refresh function to parent via ref (always force refresh)
  useImperativeHandle(ref, () => ({
    refreshProducts: async () => {
      // Clear cache to get fresh stock data
      productsCache.current.clear();
      await loadProducts(true);
    },
  }), [loadProducts]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(response);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, debouncedSearch, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Search product by barcode/SKU and add to cart
  const searchAndAddProduct = useCallback((searchValue: string) => {
    if (!searchValue.trim()) return;
    
    const product = products.find(
      (p) => p.barcode === searchValue || p.sku === searchValue
    );
    
    if (product) {
      onProductSelect(product);
      setSearch('');
    }
  }, [products, onProductSelect]);

  // Handle Enter key for barcode scanner
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchAndAddProduct(search);
    }
  }, [search, searchAndAddProduct]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black/20">
      {/* Search bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div onKeyDown={handleKeyDown}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('pos.search_barcode', 'Search or scan barcode...')}
            className="w-full"
            debounceMs={0}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800"
        role="tablist"
        aria-label={t('pos.categories', 'Product categories')}
      >
        <button
          onClick={() => setSelectedCategory(undefined)}
          role="tab"
          aria-selected={selectedCategory === undefined}
          className={`
            min-h-[48px] px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all touch-manipulation
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${selectedCategory === undefined
              ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'}
          `}
        >
          {t('common.all', 'All Items')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            role="tab"
            aria-selected={selectedCategory === cat.id}
            className={`
              min-h-[48px] px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all touch-manipulation
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${selectedCategory === cat.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'}
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-6" role="region" aria-label={t('pos.products', 'Products')}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <span className="text-6xl mb-4 grayscale">📦</span>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('pos.no_products', 'No products found')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t('pos.try_adjusting', 'Try adjusting your search or category filter')}
            </p>
          </div>
        ) : (
          <div 
            className="grid gap-4 lg:gap-5"
            style={{ 
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' 
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => {
                  onProductSelect(product);
                  setSearch('');
                }}
                formatCurrency={formatCurrency}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
