import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#144D3A]/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-2xl cursor-pointer select-none font-sans';

    const variants = {
      primary: 'bg-[#144D3A] hover:bg-[#2E7D61] text-white shadow-soft',
      secondary: 'bg-[#E8F2EC] hover:bg-[#d8ece0] text-[#144D3A]',
      outline: 'border border-[#2E7D61] hover:bg-[#E8F2EC] text-[#2E7D61] bg-transparent',
      ghost: 'bg-transparent text-[#6B7280] hover:text-[#144D3A] hover:bg-[#E8F2EC]',
      danger: 'bg-rose-50 text-[#EF4444] hover:bg-rose-100 border border-rose-200',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
      md: 'px-4 py-2.5 text-sm gap-2 rounded-2xl',
      lg: 'px-5 py-3.5 text-base gap-2.5 rounded-2xl font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
