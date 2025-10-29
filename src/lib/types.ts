import type {LucideProps} from 'lucide-react';
import type * as Lucide from 'lucide-react';

export type IconName = keyof Omit<typeof Lucide, 'createLucideIcon' | 'LucideIcon'>;

export type Category = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  iconName: IconName;
};

export type Transaction = {
  id: string;
  categoryId: string; // Will be 'income' for income transactions
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
};

export type DefaultCategory = {
  id: string;
  name: string;
  iconName: IconName;
};

export type Budget = {
  id: string;
  userId: string;
  month: string; // e.g. "2024-07"
  monthlyBudget: number;
};
