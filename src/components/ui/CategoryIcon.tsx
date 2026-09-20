import React from 'react';
import {
  Utensils,
  Home,
  Car,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Receipt,
  Gamepad2,
  Users,
  Briefcase,
  Store,
  Laptop,
  Gift,
  TrendingUp,
  PlusCircle,
  MoreHorizontal,
  Wallet,
  Tag,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', ...props }) => {
  switch (name) {
    case 'Utensils':
      return <Utensils className={className} {...props} />;
    case 'Home':
      return <Home className={className} {...props} />;
    case 'Car':
      return <Car className={className} {...props} />;
    case 'GraduationCap':
      return <GraduationCap className={className} {...props} />;
    case 'HeartPulse':
      return <HeartPulse className={className} {...props} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} {...props} />;
    case 'Receipt':
      return <Receipt className={className} {...props} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} {...props} />;
    case 'Users':
      return <Users className={className} {...props} />;
    case 'Briefcase':
      return <Briefcase className={className} {...props} />;
    case 'Store':
      return <Store className={className} {...props} />;
    case 'Laptop':
      return <Laptop className={className} {...props} />;
    case 'Gift':
      return <Gift className={className} {...props} />;
    case 'TrendingUp':
      return <TrendingUp className={className} {...props} />;
    case 'PlusCircle':
      return <PlusCircle className={className} {...props} />;
    case 'Wallet':
      return <Wallet className={className} {...props} />;
    case 'MoreHorizontal':
    default:
      return <Tag className={className} {...props} />;
  }
};
