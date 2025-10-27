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
  {id: 'groceries', name: 'Groceries', icon: ShoppingBasket},
  {id: 'transport', name: 'Transport', icon: Car},
  {id: 'utilities', name: 'Utilities', icon: Zap},
  {id: 'rent', name: 'Rent/Mortgage', icon: Home},
  {id: 'entertainment', name: 'Entertainment', icon: Ticket},
  {id: 'health', name: 'Health', icon: HeartPulse},
  {id: 'gifts', name: 'Gifts', icon: Gift},
  {id: 'other', name: 'Other', icon: Sparkles},
];
