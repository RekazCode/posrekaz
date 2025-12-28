import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface SegmentedControlOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

interface SegmentedControlProps {
    options: SegmentedControlOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    className?: string;
}

export function SegmentedControl({
    options,
    value,
    onChange,
    className,
}: SegmentedControlProps) {
    return (
        <div
            className={cn(
                'flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg',
                className
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        onClick={() => !option.disabled && onChange(option.value)}
                        disabled={option.disabled}
                        className={cn(
                            'relative flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-md touch-target min-h-[40px]',
                            isActive ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                            option.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="segmented-control-bg"
                                className="absolute inset-0 bg-white dark:bg-zinc-700 shadow-sm rounded-md"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default SegmentedControl;
