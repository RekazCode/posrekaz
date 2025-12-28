import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Delete, Check } from 'lucide-react';
import { useLocaleStore } from '../../stores';

interface NumericKeypadProps {
    onKeyPress: (key: string) => void;
    onClear: () => void;
    onEnter?: () => void;
    onBackspace: () => void;
    className?: string;
    showEnter?: boolean;
}

export function NumericKeypad({
    onKeyPress,
    onClear,
    onEnter,
    onBackspace,
    className,
    showEnter = true,
}: NumericKeypadProps) {
    const { t } = useLocaleStore();
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

    return (
        <div 
            className={cn('grid grid-cols-3 gap-3', className)}
            role="group"
            aria-label={t('common.numeric_keypad', 'Numeric keypad')}
        >
            {keys.map((key) => (
                <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onKeyPress(key)}
                    aria-label={key === '.' ? t('common.decimal_point', 'Decimal point') : key}
                    className="h-12 min-h-[48px] min-w-[48px] rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xl font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 active:bg-gray-100 dark:active:bg-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                >
                    {key}
                </motion.button>
            ))}

            {/* Backspace Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBackspace}
                aria-label={t('common.delete_last', 'Delete last digit')}
                className="h-12 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-200 dark:hover:bg-zinc-700 active:bg-gray-300 dark:active:bg-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
            >
                <Delete className="w-7 h-7" />
            </motion.button>

            {/* Clear Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClear}
                aria-label={t('common.clear_all', 'Clear all')}
                className="h-12 min-h-[48px] min-w-[48px] col-span-1 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold text-lg shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation"
            >
                C
            </motion.button>

            {/* Enter Button (if enabled, spans 2 cols) */}
            {showEnter && (
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onEnter}
                    aria-label={t('common.confirm', 'Confirm')}
                    className="h-12 min-h-[48px] col-span-2 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation"
                >
                    <Check className="w-7 h-7" />
                </motion.button>
            )}
        </div>
    );
}

export default NumericKeypad;
