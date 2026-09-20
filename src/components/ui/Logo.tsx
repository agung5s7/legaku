import React from 'react';

export interface LogoProps {
  variant?: 'full' | 'horizontal' | 'mark-only';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

/**
 * Official LEGAKU Leaf Mark & Wordmark Logo Component
 * - 3-Layer Organic Leaf Mark matching the official brand asset
 * - Wordmark: "LEGAKU"
 * - Tagline: "Atur uang. Hidup lebih lega."
 */
export const LeafMark: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => {
  return (
    <img
      src="/logo-mark.png"
      alt="LEGAKU"
      width={size}
      height={Math.round(size * (554 / 657))}
      style={{ width: `${size}px`, height: 'auto', aspectRatio: '657 / 554' }}
      className={`shrink-0 object-contain select-none ${className}`}
      loading="eager"
      decoding="sync"
    />
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  // Dimension tokens
  const dimensions = {
    xs: { markSize: 24, textSize: 'text-sm', taglineSize: 'text-[9px]' },
    sm: { markSize: 32, textSize: 'text-base', taglineSize: 'text-[10px]' },
    md: { markSize: 48, textSize: 'text-xl', taglineSize: 'text-xs' },
    lg: { markSize: 64, textSize: 'text-2xl', taglineSize: 'text-sm' },
    xl: { markSize: 88, textSize: 'text-3xl', taglineSize: 'text-base' },
  }[size];

  if (variant === 'mark-only') {
    return <LeafMark size={dimensions.markSize} className={className} />;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <LeafMark size={dimensions.markSize} />
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight text-[#144D3A] leading-tight ${dimensions.textSize} font-sans`}>
            LEGAKU
          </span>
          {showTagline && (
            <span className={`text-[#2E7D61] font-medium leading-none ${dimensions.taglineSize} font-sans`}>
              Atur uang. Hidup lebih lega.
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full stacked variant
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      <LeafMark size={dimensions.markSize} className="mb-2" />
      <h1 className={`font-bold tracking-tight text-[#144D3A] ${dimensions.textSize} font-sans`}>
        LEGAKU
      </h1>
      {showTagline && (
        <p className={`text-[#2E7D61] font-medium mt-0.5 ${dimensions.taglineSize} font-sans`}>
          Atur uang. Hidup lebih lega.
        </p>
      )}
    </div>
  );
};
