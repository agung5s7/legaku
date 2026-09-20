import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'sage' | 'forest' | 'cream' | 'terracotta' | 'gold';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'sage',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    sage: 'bg-sage-100 text-forest-800 border border-sage-200/60',
    forest: 'bg-forest-800 text-warm-white border border-forest-700',
    cream: 'bg-cream-100 text-warm-dark border border-warm-border/60',
    terracotta: 'bg-earth-terracotta/15 text-earth-rust border border-earth-terracotta/25',
    gold: 'bg-earth-gold/15 text-[#8A671C] border border-earth-gold/25',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs font-medium rounded-full',
    md: 'px-3 py-1 text-sm font-medium rounded-full',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
