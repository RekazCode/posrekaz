import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Badge } from '../ui';
import type { POSProduct } from '../../types';

interface ProductCardProps {
    product: POSProduct;
    onClick: () => void;
    formatCurrency: (amount: number) => string;
    t: (key: string, fallback: string) => string;
}

// Memoized ProductCard to prevent unnecessary re-renders
export const ProductCard = memo(function ProductCard({ product, onClick, formatCurrency, t }: ProductCardProps) {
    const isOutOfStock = product.available_quantity <= 0;
    const isLowStock = product.available_quantity > 0 && product.available_quantity <= 5;

    return (
        <motion.button
            onClick={onClick}
            disabled={isOutOfStock}
            whileTap={!isOutOfStock ? { scale: 0.96 } : undefined}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "group relative flex flex-col w-full text-start bg-white dark:bg-zinc-900 rounded-xl border-2 border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden",
                "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "active:scale-[0.98] touch-manipulation",
                isOutOfStock && "opacity-60 cursor-not-allowed grayscale"
            )}
            style={{
                minHeight: '180px',
                minWidth: '160px',
            }}
            aria-label={`${product.name}, ${formatCurrency(product.sale_price)}${isOutOfStock ? ', out of stock' : isLowStock ? ', low stock' : ''}`}
            aria-disabled={isOutOfStock}
        >
            {/* Image Section */}
            <div className="relative w-full h-24 sm:h-28 bg-gray-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <span className="text-4xl select-none">📦</span>
                )}

                {/* Stock Badge Overlay */}
                <div className="absolute top-2 end-2">
                    {isOutOfStock ? (
                        <Badge variant="danger" size="sm" className="shadow-sm">
                            {t('pos.out', 'Out')}
                        </Badge>
                    ) : isLowStock ? (
                        <Badge variant="warning" size="sm" className="shadow-sm">
                            {product.available_quantity}
                        </Badge>
                    ) : null}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-3 sm:p-4 w-full">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug mb-auto">
                    {product.name}
                </h3>

                <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
                    <span className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatCurrency(product.sale_price)}
                    </span>

                    {!isOutOfStock && !isLowStock && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md tabular-nums">
                            {product.available_quantity}
                        </span>
                    )}
                </div>
            </div>
        </motion.button>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if product data changed
    return (
        prevProps.product.id === nextProps.product.id &&
        prevProps.product.available_quantity === nextProps.product.available_quantity &&
        prevProps.product.sale_price === nextProps.product.sale_price &&
        prevProps.product.name === nextProps.product.name &&
        prevProps.product.image_url === nextProps.product.image_url
    );
});
