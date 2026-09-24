import React from 'react';
import { Wallet, Landmark, Smartphone, CreditCard } from 'lucide-react';
import { AccountType } from '../../types';

interface BrandIconProps {
  name: string;
  type: AccountType;
  className?: string;
}

const BRANDS = [
  { keywords: ['bca'], bg: 'bg-[#00529C]', text: 'text-white', label: 'BCA' }, // Using a strong blue for BCA
  { keywords: ['mandiri'], bg: 'bg-[#003D79]', text: 'text-[#F2A900]', label: 'M' },
  { keywords: ['bni'], bg: 'bg-[#005E6A]', text: 'text-[#F15A23]', label: 'BNI' },
  { keywords: ['bri'], bg: 'bg-[#00529C]', text: 'text-white', label: 'BRI' },
  { keywords: ['bsi', 'syariah'], bg: 'bg-[#00A39D]', text: 'text-[#F39200]', label: 'BSI' },
  { keywords: ['cimb', 'niaga'], bg: 'bg-[#7A003C]', text: 'text-white', label: 'CIMB' },
  { keywords: ['jago'], bg: 'bg-[#F37021]', text: 'text-white', label: 'Jago' },
  { keywords: ['jenius', 'btpn'], bg: 'bg-[#00B1CD]', text: 'text-white', label: 'J' },
  { keywords: ['seabank', 'sea'], bg: 'bg-[#FF7300]', text: 'text-white', label: 'Sea' },
  { keywords: ['blu'], bg: 'bg-[#00A3E0]', text: 'text-white', label: 'blu' },
  { keywords: ['gopay', 'go-pay', 'gojek'], bg: 'bg-[#00AED6]', text: 'text-white', label: 'Go' },
  { keywords: ['ovo'], bg: 'bg-[#4C3494]', text: 'text-white', label: 'OVO' },
  { keywords: ['dana'], bg: 'bg-[#118EEA]', text: 'text-white', label: 'D' },
  { keywords: ['shopee', 'spay'], bg: 'bg-[#EE4D2D]', text: 'text-white', label: 'S' },
  { keywords: ['linkaja', 'link aja'], bg: 'bg-[#DF192A]', text: 'text-white', label: 'LA' },
  { keywords: ['cash', 'tunai', 'dompet'], bg: 'bg-[#2E7D61]', text: 'text-white', label: 'Rp' },
];

export const BrandIcon: React.FC<BrandIconProps> = ({ name, type, className = 'w-11 h-11' }) => {
  const normalizedName = name.toLowerCase();
  
  const matchedBrand = BRANDS.find(brand => 
    brand.keywords.some(kw => normalizedName.includes(kw))
  );

  if (matchedBrand) {
    // Dynamic text size based on container size heuristics
    const isSmall = className.includes('w-9');
    
    let textSize = 'text-sm';
    if (matchedBrand.label.length > 3) {
      textSize = isSmall ? 'text-[9px]' : 'text-[11px]';
    } else if (matchedBrand.label.length === 3) {
      textSize = isSmall ? 'text-[10px]' : 'text-xs';
    } else if (matchedBrand.label.length === 2) {
      textSize = isSmall ? 'text-xs' : 'text-sm';
    } else {
      textSize = isSmall ? 'text-sm' : 'text-base';
    }

    return (
      <div className={`${className} rounded-2xl ${matchedBrand.bg} ${matchedBrand.text} flex items-center justify-center font-bold shadow-sm tracking-tight shrink-0`}>
        <span className={`${textSize}`}>
          {matchedBrand.label}
        </span>
      </div>
    );
  }

  // Fallback to generic lucide icons if no brand matches
  const iconClass = className.includes('w-9') ? "w-4 h-4 text-[#144D3A]" : "w-5 h-5 text-[#144D3A]";
  const getGenericIcon = () => {
    switch (type) {
      case 'bank': return <Landmark className={iconClass} />;
      case 'ewallet': return <Smartphone className={iconClass} />;
      case 'credit_card': return <CreditCard className={iconClass} />;
      case 'cash':
      default: return <Wallet className={iconClass} />;
    }
  };

  return (
    <div className={`${className} rounded-2xl bg-[#E8F2EC] flex items-center justify-center shrink-0 shadow-subtle`}>
      {getGenericIcon()}
    </div>
  );
};
