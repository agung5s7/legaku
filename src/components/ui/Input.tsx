import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, prefixElement, suffixElement, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#1F2937] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixElement && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#6B7280]">
              {prefixElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] transition-all duration-200 outline-none',
              'focus:border-[#144D3A] focus:ring-2 focus:ring-[#144D3A]/15',
              prefixElement && 'pl-11',
              suffixElement && 'pr-11',
              error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/15',
              className
            )}
            {...props}
          />
          {suffixElement && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[#6B7280]">
              {suffixElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {!error && helper && <p className="text-xs text-[#6B7280]">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
