import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'dark' | 'success' | 'danger' | 'warning';
  className?: string;
  fullScreen?: boolean;
  text?: string;
  overlay?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  fullScreen = false,
  text,
  overlay = false,
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeMap = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  // Color mappings
  const colorMap = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    dark: 'border-gray-800 border-t-transparent',
    success: 'border-green-500 border-t-transparent',
    danger: 'border-red-500 border-t-transparent',
    warning: 'border-yellow-500 border-t-transparent',
  };

  // Text size mappings
  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const spinnerClasses = cn(
    'inline-block rounded-full animate-spin',
    sizeMap[size],
    colorMap[color],
    className
  );

  const textClasses = cn(
    'mt-3 text-center',
    textSizeMap[size],
    color === 'white' ? 'text-white' : 'text-gray-700'
  );

  const containerClasses = cn(
    'flex flex-col items-center justify-center',
    fullScreen && 'fixed inset-0 z-50',
    overlay && 'bg-black/30 backdrop-blur-sm'
  );

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} />
      {text && <p className={textClasses}>{text}</p>}
    </div>
  );
}