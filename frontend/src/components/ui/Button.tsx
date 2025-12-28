/**
 * Button Component - Enhanced for Touch & Animation
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'touch';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  default: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-zinc-100 dark:text-zinc-900',
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300',
  ghost: 'btn-ghost',
  destructive: 'btn-danger',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-10 px-4 text-sm min-w-[40px]',
  md: 'h-12 px-5 text-base min-w-[48px]',
  lg: 'h-14 px-6 text-lg min-w-[56px]',
  touch: 'h-[72px] w-full text-lg font-semibold min-w-[72px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    disabled,
    isLoading,
    leftIcon,
    rightIcon,
    children,
    ...props
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'active:scale-[0.98] touch-manipulation',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <LoadingSpinner className="w-4 h-4" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
