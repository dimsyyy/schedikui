import type {LucideIcon} from 'lucide-react';

export type Category = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: LucideIcon;
};

export type Transaction = {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  date: string;
};
