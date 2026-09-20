import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'forest' | 'sage' | 'muted';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-warm-border/60 shadow-soft text-warm-dark',
      forest: 'bg-gradient-to-br from-forest-800 to-forest-900 text-warm-white border border-forest-700/50 shadow-card',
      sage: 'bg-sage-50/80 border border-sage-200/70 text-forest-950 shadow-soft',
      muted: 'bg-cream-100/70 border border-warm-border/50 text-warm-dark shadow-none',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-3xl p-4 sm:p-5 transition-all duration-200', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
