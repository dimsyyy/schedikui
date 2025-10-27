import {
  Car,
  Home,
  ShoppingBasket,
  Zap,
  Ticket,
  HeartPulse,
  Gift,
  LucideIcon,
  Sparkles
} from 'lucide-react';

export type DefaultCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {id: 'groceries', name: 'Belanja Bulanan', icon: ShoppingBasket},
  {id: 'transport', name: 'Transportasi', icon: Car},
  {id: 'utilities', name: 'Tagihan', icon: Zap},
  {id: 'rent', name: 'Sewa/Cicilan', icon: Home},
  {id: 'entertainment', name: 'Hiburan', icon: Ticket},
  {id: 'health', name: 'Kesehatan', icon: HeartPulse},
  {id: 'gifts', name: 'Hadiah', icon: Gift},
  {id: 'other', name: 'Lainnya', icon: Sparkles},
];
