import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  fullHeightOnMobile?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  bodyClassName,
  fullHeightOnMobile = false,
  size = 'md',
}) => {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#144D3A]/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-white rounded-t-[2rem] sm:rounded-3xl shadow-elevated z-10 border border-[#E5E7EB] transition-all transform flex flex-col font-sans',
          size === 'sm' && 'max-w-sm',
          size === 'md' && 'max-w-md',
          size === 'lg' && 'max-w-xl',
          size === 'xl' && 'max-w-2xl',
          fullHeightOnMobile ? 'max-h-[92vh]' : 'max-h-[90vh]',
          className
        )}
      >
        {/* Mobile Pull Bar */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center cursor-grab">
          <div className="w-12 h-1.5 bg-[#E5E7EB] rounded-full" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-4 sm:px-6 pt-3 sm:pt-5 pb-2.5 sm:pb-3 border-b border-[#E5E7EB]/70">
            <div>
              {title && <h2 className="text-base sm:text-lg font-bold text-[#144D3A] tracking-tight">{title}</h2>}
              {subtitle && <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#6B7280] hover:text-[#144D3A] hover:bg-[#E8F2EC] transition-colors cursor-pointer"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn('p-4 sm:p-6 overflow-y-auto no-scrollbar', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
};
